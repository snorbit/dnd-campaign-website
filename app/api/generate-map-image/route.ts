import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SD_URL = process.env.SD_LOCAL_URL || 'http://127.0.0.1:7860';

export async function POST(request: NextRequest) {
    try {
        const { prompt, campaignId } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        console.log('Generating AI map with SD:', prompt);

        // Build a rich top-down prompt
        const fullPrompt = [
            'top-down view',
            "bird's eye view",
            'looking straight down from above',
            'orthographic top-down',
            'tabletop RPG battle map',
            'dnd map style',
            prompt,
            'high detail',
            'fantasy setting',
            'grid overlay',
            'vibrant colors',
            'hand-drawn style',
            'no characters',
            'empty map ready for play'
        ].join(', ');

        const negativePrompt = [
            'isometric', 'perspective', 'side view', 'low angle', 'tilted',
            '3d rendered perspective', 'blurry', 'low quality', 'text', 'watermark',
            'signature', 'ugly', 'distorted', 'characters', 'people', 'figures',
            'monsters visible', 'fog of war', 'ui elements'
        ].join(', ');

        // Check if local Stable Diffusion is available
        let sdAvailable = false;
        try {
            const checkRes = await fetch(`${SD_URL}/sdapi/v1/sd-models`, {
                signal: AbortSignal.timeout(2000)
            });
            sdAvailable = checkRes.ok;
        } catch {
            sdAvailable = false;
        }

        if (!sdAvailable) {
            // Return a descriptive placeholder with status info
            return NextResponse.json({
                success: false,
                imageUrl: null,
                error: 'Local Stable Diffusion is not running. Start SD WebUI at http://127.0.0.1:7860 with --api flag.',
                prompt: fullPrompt
            }, { status: 503 });
        }

        // Call Stable Diffusion
        const sdRes = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: fullPrompt,
                negative_prompt: negativePrompt,
                steps: 30,
                cfg_scale: 7.5,
                width: 768,
                height: 768,
                sampler_name: 'DPM++ 2M Karras',
                batch_size: 1,
                n_iter: 1,
            }),
            signal: AbortSignal.timeout(120000)
        });

        if (!sdRes.ok) {
            const errText = await sdRes.text();
            throw new Error(`Stable Diffusion error: ${errText}`);
        }

        const sdData = await sdRes.json();
        const base64Image = sdData.images?.[0];

        if (!base64Image) {
            throw new Error('No image returned from Stable Diffusion');
        }

        // Upload to Supabase Storage
        const folder = campaignId || 'manual';
        const filename = `${folder}/map_${Date.now()}.png`;
        const imageBuffer = Buffer.from(base64Image, 'base64');

        const { error: uploadError } = await supabase.storage
            .from('campaign-maps')
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('campaign-maps')
            .getPublicUrl(filename);

        return NextResponse.json({
            success: true,
            imageUrl: publicUrl
        });

    } catch (error) {
        console.error('Error generating map:', error);
        return NextResponse.json(
            { error: 'Failed to generate map: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
