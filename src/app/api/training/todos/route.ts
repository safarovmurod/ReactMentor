import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const PostSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1),
});

const PutSchema = z.object({
  workspaceId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId лозим аст' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json([
        { id: '1', title: 'Омӯзиши React State (Local demo)', completed: false },
        { id: '2', title: 'Машқи CRUD дар Next.js', completed: true },
      ]);
    }

    const { data, error } = await admin
      .from('training_todos')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Маълумоти нодуруст', details: parsed.error.issues }, { status: 400 });
    }

    const { workspaceId, title } = parsed.data;
    const admin = getSupabaseAdminClient();

    if (!admin) {
      return NextResponse.json({
        id: Date.now().toString(),
        workspace_id: workspaceId,
        title,
        completed: false,
        created_at: new Date().toISOString(),
      });
    }

    const { data, error } = await admin
      .from('training_todos')
      .insert({ workspace_id: workspaceId, title, completed: false })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Маълумоти нодуруст', details: parsed.error.issues }, { status: 400 });
    }

    const { workspaceId, id, title, completed } = parsed.data;
    const admin = getSupabaseAdminClient();

    if (!admin) {
      return NextResponse.json({ id, title: title || 'Updated', completed: completed ?? true });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const { data, error } = await admin
      .from('training_todos')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const id = searchParams.get('id');

    if (!workspaceId || !id) {
      return NextResponse.json({ error: 'workspaceId ва id лозиманд' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return new NextResponse(null, { status: 204 });
    }

    const { error } = await admin
      .from('training_todos')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
