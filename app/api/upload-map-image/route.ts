import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'campaign-maps';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server is missing Supabase upload configuration.' },
                { status: 500 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'You must be signed in to upload maps.' }, { status: 401 });
        }

        const admin = createClient(supabaseUrl, serviceRoleKey);
        const { data: { user }, error: authError } = await admin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Your sign-in expired. Sign in again and retry.' }, { status: 401 });
        }

        const formData = await request.formData();
        const campaignId = String(formData.get('campaignId') || '');
        const file = formData.get('file');
        const title = String(formData.get('title') || 'map');
        const kind = String(formData.get('kind') || 'map');

        if (!campaignId || !(file instanceof File)) {
            return NextResponse.json({ error: 'Upload is missing a campaign or image file.' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json({ error: 'Only PNG, JPG, and WEBP map images are supported.' }, { status: 400 });
        }

        if (file.size > MAX_IMAGE_BYTES) {
            return NextResponse.json({ error: 'That map image is too large. Use an image under 12 MB.' }, { status: 400 });
        }

        const { data: campaign, error: campaignError } = await admin
            .from('campaigns')
            .select('id, dm_id')
            .eq('id', campaignId)
            .maybeSingle();

        if (campaignError) throw campaignError;
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
        }
        if (campaign.dm_id !== user.id) {
            return NextResponse.json({ error: 'Only the DM can upload maps for this campaign.' }, { status: 403 });
        }

        const extension = extensionFromType(file.type);
        const path = `${campaignId}/imports/${Date.now()}-${crypto.randomUUID()}-${slugify(title)}-${slugify(kind)}.${extension}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await admin.storage
            .from(BUCKET)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

        return NextResponse.json({ success: true, url: publicUrl, path });
    } catch (error) {
        console.error('Map image upload failed:', error);
        return NextResponse.json(
            { error: `Map image upload failed: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

function extensionFromType(type: string) {
    if (type === 'image/jpeg') return 'jpg';
    if (type === 'image/webp') return 'webp';
    return 'png';
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'map';
}
