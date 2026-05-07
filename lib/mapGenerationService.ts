import { createClient } from '@supabase/supabase-js';
import { generateProceduralMapSvg, ProceduralMapOptions } from '@/lib/proceduralMap';

const SD_URL = process.env.SD_LOCAL_URL || 'http://127.0.0.1:7860';
const BUCKET = 'campaign-maps';

export interface GenerateMapRequest extends ProceduralMapOptions {
    campaignId?: string;
    title?: string;
    preferStableDiffusion?: boolean;
}

export interface GenerateMapResponse {
    success: boolean;
    imageUrl: string;
    source: 'stable-diffusion' | 'procedural';
    title: string;
    metadata: Record<string, unknown>;
    warning?: string;
}

export async function generateBattleMap(input: GenerateMapRequest): Promise<GenerateMapResponse> {
    if (!input.prompt?.trim()) {
        throw new Error('Missing prompt');
    }

    const title = input.title?.trim() || input.prompt.trim().slice(0, 60) || 'Generated Map';
    const preferStableDiffusion = input.preferStableDiffusion !== false;

    if (preferStableDiffusion && await checkSDAvailable()) {
        try {
            const imageBuffer = await generateWithStableDiffusion(input.prompt);
            const imageUrl = await storeMapAsset({
                campaignId: input.campaignId,
                title,
                extension: 'png',
                contentType: 'image/png',
                body: imageBuffer,
            });

            return {
                success: true,
                imageUrl,
                source: 'stable-diffusion',
                title,
                metadata: { prompt: input.prompt },
            };
        } catch (error) {
            console.warn('Stable Diffusion map generation failed, falling back to procedural map:', error);
        }
    }

    const generated = generateProceduralMapSvg(input);
    const svgBuffer = Buffer.from(generated.svg, 'utf8');
    const fallbackDataUrl = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;

    let imageUrl = fallbackDataUrl;
    let warning: string | undefined;
    try {
        imageUrl = await storeMapAsset({
            campaignId: input.campaignId,
            title,
            extension: 'svg',
            contentType: 'image/svg+xml',
            body: svgBuffer,
        });
    } catch (error) {
        warning = `Generated procedural map but could not upload to Supabase Storage: ${(error as Error).message}`;
    }

    return {
        success: true,
        imageUrl,
        source: 'procedural',
        title,
        metadata: {
            ...generated.metadata,
            mapType: generated.mapType,
            storage: warning ? 'data-url' : 'supabase',
        },
        warning,
    };
}

async function generateWithStableDiffusion(prompt: string): Promise<Buffer> {
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
        'clear paths',
        'empty map ready for play',
        'no characters',
    ].join(', ');

    const negativePrompt = [
        'isometric', 'perspective', 'side view', 'low angle', 'tilted',
        '3d rendered perspective', 'blurry', 'low quality', 'text', 'watermark',
        'signature', 'characters', 'people', 'figures', 'monsters visible',
        'fog of war', 'ui elements', 'logo',
    ].join(', ');

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
        signal: AbortSignal.timeout(120000),
    });

    if (!sdRes.ok) {
        throw new Error(`Stable Diffusion error: ${await sdRes.text()}`);
    }

    const sdData = await sdRes.json();
    const base64Image = sdData.images?.[0];
    if (!base64Image) throw new Error('No image returned from Stable Diffusion');

    return Buffer.from(base64Image, 'base64');
}

async function checkSDAvailable(): Promise<boolean> {
    try {
        const checkRes = await fetch(`${SD_URL}/sdapi/v1/sd-models`, {
            signal: AbortSignal.timeout(2000),
        });
        return checkRes.ok;
    } catch {
        return false;
    }
}

async function storeMapAsset({
    campaignId,
    title,
    extension,
    contentType,
    body,
}: {
    campaignId?: string;
    title: string;
    extension: string;
    contentType: string;
    body: Buffer;
}) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase Storage upload requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    const storageClient = createClient(supabaseUrl, serviceRoleKey);
    const folder = campaignId || 'manual';
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'map';
    const filename = `${folder}/${safeTitle}_${Date.now()}.${extension}`;

    const { error: uploadError } = await storageClient.storage
        .from(BUCKET)
        .upload(filename, body, {
            contentType,
            upsert: true,
        });

    if (uploadError) {
        throw new Error(uploadError.message);
    }

    const { data: { publicUrl } } = storageClient.storage.from(BUCKET).getPublicUrl(filename);
    return publicUrl;
}
