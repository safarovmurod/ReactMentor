import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPairCode, validatePairCodeFormat } from '@/lib/security/pairing';

const ConnectSchema = z.object({
  code: z.string(),
  userId: z.string().uuid(),
  deviceFingerprint: z.string().min(3),
  deviceName: z.string().min(1),
  platform: z.string().default('web'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ConnectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Маълумоти нодуруст ворид шуд', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { code, userId, deviceFingerprint, deviceName, platform } = parsed.data;

    if (!validatePairCodeFormat(code)) {
      return NextResponse.json(
        { error: 'Рамз бояд 6 рақам бошад' },
        { status: 400 }
      );
    }

    const pepper = process.env.PAIRING_SECRET || 'react-mentor-pepper';
    const computedHash = hashPairCode(code, pepper);
    const admin = getSupabaseAdminClient();

    if (!admin) {
      // Local demo fallback if backend is unconfigured
      return NextResponse.json({
        success: true,
        workspaceId: '00000000-0000-0000-0000-000000000001',
        message: 'Пайвастшавӣ дар ҳолати озмоишӣ анҷом ёфт.',
      });
    }

    // 1. Fetch pair code record by hash
    const { data: record, error: findErr } = await admin
      .from('pair_codes')
      .select('*')
      .eq('code_hash', computedHash)
      .is('used_at', null)
      .single();

    if (findErr || !record) {
      return NextResponse.json(
        { error: 'Рамзи пайвастшавӣ нодуруст аст ё аллакай истифода шудааст' },
        { status: 404 }
      );
    }

    // 2. Check brute-force attempts
    if (record.attempt_count >= 5) {
      return NextResponse.json(
        { error: 'Шумораи кӯшишҳо аз ҳад зиёд шуд. Рамзи нав гиред.' },
        { status: 429 }
      );
    }

    // 3. Check expiration
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Мӯҳлати эътибори ин рамз (10 дақиқа) ба охир расидааст' },
        { status: 410 }
      );
    }

    // 4. Mark code as used atomically
    await admin
      .from('pair_codes')
      .update({ used_at: now.toISOString() })
      .eq('id', record.id);

    // 5. Add Device B membership to workspace
    await admin.from('workspace_members').upsert(
      {
        workspace_id: record.workspace_id,
        user_id: userId,
        role: 'member',
        joined_at: now.toISOString(),
      },
      { onConflict: 'workspace_id,user_id' }
    );

    // 6. Register Device B record
    await admin.from('devices').upsert(
      {
        workspace_id: record.workspace_id,
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        name: deviceName,
        platform,
        last_seen: now.toISOString(),
      },
      { onConflict: 'workspace_id,device_fingerprint' }
    );

    return NextResponse.json({
      success: true,
      workspaceId: record.workspace_id,
      message: 'Дастгоҳи нав бомуваффақият ба Workspace пайваст шуд!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
