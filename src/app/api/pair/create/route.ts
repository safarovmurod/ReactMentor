import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { generatePairCode } from '@/lib/security/pairing';

const RequestSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Маълумоти нодуруст ворид шуд', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, userId } = parsed.data;
    const pepper = process.env.PAIRING_SECRET || 'react-mentor-pepper';
    const admin = getSupabaseAdminClient();

    // If Supabase Admin is not configured, generate a local simulation code
    if (!admin) {
      const generated = generatePairCode(pepper);
      return NextResponse.json({
        code: `${generated.code.slice(0, 3)} ${generated.code.slice(3)}`,
        expiresAt: generated.expiresAt.toISOString(),
        warning: 'Ҳолати маҳаллӣ: Supabase танзим нашудааст.',
      });
    }

    // Verify user is member or owner of workspace
    const { data: member, error: memberErr } = await admin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (memberErr || !member) {
      return NextResponse.json(
        { error: 'Шумо узви ин workspace нестед' },
        { status: 403 }
      );
    }

    const generated = generatePairCode(pepper);

    // Insert pair code into DB
    const { error: insertErr } = await admin.from('pair_codes').insert({
      workspace_id: workspaceId,
      code_hash: generated.codeHash,
      expires_at: generated.expiresAt.toISOString(),
      created_by: userId,
    });

    if (insertErr) {
      return NextResponse.json({ error: 'Хатогӣ ҳангоми сабти рамз' }, { status: 500 });
    }

    return NextResponse.json({
      code: `${generated.code.slice(0, 3)} ${generated.code.slice(3)}`,
      expiresAt: generated.expiresAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
