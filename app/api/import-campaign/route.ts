import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SD_URL = process.env.SD_LOCAL_URL || 'http://127.0.0.1:7860';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Create an authenticated Supabase client using the user's JWT
// This ensures auth.uid() resolves correctly and RLS policies pass
function createAuthClient(token: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        // Extract the user's JWT from the Authorization header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized — missing auth token' }, { status: 401 });
        }

        // Use authenticated client so RLS passes (auth.uid() = DM's user id)
        const supabase = createAuthClient(token);

        const { campaignId, campaignText } = await request.json();

        if (!campaignText || !campaignId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('Starting session import for campaign:', campaignId);

        // Step 1: Parse the session text using Ollama (free local AI) or smart regex fallback
        const parsed = await parseSessionText(campaignText);

        console.log('Parsed session:', JSON.stringify(parsed, null, 2));

        // Step 2: Generate maps for each location + travel maps
        const maps = await generateAllMaps(parsed.locations, campaignId);

        console.log('Generated maps:', maps.length);

        // Step 3: Save session to database
        const { data: session, error: sessionError } = await supabase
            .from('campaign_sessions')
            .insert({
                campaign_id: campaignId,
                title: parsed.title || 'Imported Session',
                description: parsed.description,
                session_text: campaignText,
                maps_generated: maps.length,
                quests_created: parsed.quests.length,
                items_added: parsed.items.length,
                encounters_created: parsed.encounters.length
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Step 4: Add maps to campaign
        await addMapsToCampaign(supabase, campaignId, maps);

        // Step 5: Create quests
        await createQuests(supabase, campaignId, parsed.quests);

        // Step 6: Add items
        await addItems(supabase, campaignId, parsed.items);

        // Step 7: Create encounters
        await createEncounters(supabase, campaignId, parsed.encounters);

        const summary = `✅ Session imported successfully!

📍 ${maps.length} maps generated (${parsed.locations.length} locations + ${maps.length - parsed.locations.length} travel maps)
📜 ${parsed.quests.length} quests created
🎒 ${parsed.items.length} items added  
⚔️ ${parsed.encounters.length} encounters created

Your session "${parsed.title}" is ready to play!`;

        return NextResponse.json({
            success: true,
            summary,
            generated: {
                maps: maps.length,
                quests: parsed.quests.length,
                items: parsed.items.length,
                encounters: parsed.encounters.length
            }
        });

    } catch (error) {
        console.error('Error importing session:', error);
        return NextResponse.json(
            { error: 'Failed to import session: ' + (error as Error).message },
            { status: 500 }
        );
    }
}

// ─── AI Text Parsing (Free — Ollama) ─────────────────────────────────────────

async function parseSessionText(text: string) {
    // Try Ollama first (free, local LLM)
    const ollamaAvailable = await checkOllamaAvailable();
    if (ollamaAvailable) {
        try {
            return await parseWithOllama(text);
        } catch (err) {
            console.warn('Ollama parsing failed, falling back to smart regex:', err);
        }
    } else {
        console.log('[Import] Ollama not running — using smart regex parser');
    }
    return parseWithSmartRegex(text);
}

async function checkOllamaAvailable(): Promise<boolean> {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`, {
            signal: AbortSignal.timeout(2000)
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function parseWithOllama(text: string) {
    const systemPrompt = `You are a D&D session assistant. Extract structured data from session notes.
Return ONLY raw JSON (no markdown, no code fences) exactly in this shape:
{
  "title": "Session title or name",
  "description": "2-3 sentence summary",
  "locations": [{"name": "Name", "description": "Atmospheric description for map generation", "order": 0}],
  "quests": [{"name": "Quest title", "description": "Quest description"}],
  "items": [{"name": "Item name", "quantity": 1}],
  "encounters": [{"name": "Enemy or encounter name", "location": "Where it happens", "difficulty": 3}]
}
Difficulty scale: 1=trivial, 3=moderate, 5=hard, 8=boss. Extract ALL mentioned content.`;

    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Parse this D&D session:\n\n${text}` }
            ],
            temperature: 0.2,
            stream: false
        }),
        signal: AbortSignal.timeout(60000) // 60s for local LLM
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content from Ollama');

    // Strip any accidental markdown fencing
    const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(jsonStr);
}

// ─── Smart Regex Fallback ─────────────────────────────────────────────────────

function parseWithSmartRegex(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let title = 'Untitled Session';
    let description = '';
    const locations: Array<{ name: string; description: string; order: number }> = [];
    const quests: Array<{ name: string; description: string }> = [];
    const items: Array<{ name: string; quantity: number }> = [];
    const encounters: Array<{ name: string; location: string; difficulty: number }> = [];

    let currentSection = '';
    let locationOrder = 0;
    const descLines: string[] = [];

    // Keywords that signal D&D enemies (for auto-detecting encounters)
    const enemyKeywords = ['goblin', 'orc', 'skeleton', 'zombie', 'dragon', 'bandit', 'wolf', 'troll',
        'ogre', 'vampire', 'wraith', 'ghoul', 'spider', 'rat', 'bear', 'cultist', 'guard', 'assassin', 'demon'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Title: first line or lines with "session #"
        if (i === 0 || lower.match(/^session\s*\d*/)) {
            title = line.replace(/^session\s*\d*\s*[-:]/i, '').trim() || line;
            continue;
        }

        // Section headers (case-insensitive, with or without colon)
        if (/^(locations?|places?|areas?)\s*:?$/i.test(lower)) { currentSection = 'locations'; continue; }
        if (/^(quests?|objectives?|missions?)\s*:?$/i.test(lower)) { currentSection = 'quests'; continue; }
        if (/^(encounters?|enemies|monsters?|combat)\s*:?$/i.test(lower)) { currentSection = 'encounters'; continue; }
        if (/^(items?|loot|treasure|rewards?|inventory)\s*:?$/i.test(lower)) { currentSection = 'items'; continue; }
        if (/^(notes?|summary|description|overview)\s*:?$/i.test(lower)) { currentSection = 'description'; continue; }

        const cleanLine = line.replace(/^[-•*\d]+\.?\s*/, '').trim();
        if (!cleanLine) continue;

        if (currentSection === 'locations') {
            const parts = cleanLine.match(/^(.+?)\s*[-–:]\s*(.+)$/);
            if (parts) {
                locations.push({ name: parts[1].trim(), description: parts[2].trim(), order: locationOrder++ });
            } else {
                locations.push({ name: cleanLine, description: cleanLine.toLowerCase(), order: locationOrder++ });
            }
        } else if (currentSection === 'quests') {
            const parts = cleanLine.match(/^(.+?)\s*[-–:]\s*(.+)$/);
            quests.push({ name: parts ? parts[1].trim() : cleanLine, description: parts ? parts[2].trim() : cleanLine });
        } else if (currentSection === 'items') {
            const qtyMatch = cleanLine.match(/^(.+?)\s*[x×](\d+)\s*$/i) || cleanLine.match(/^(\d+)\s+(.+)$/);
            if (qtyMatch) {
                const isNumFirst = /^\d/.test(cleanLine);
                items.push({
                    name: isNumFirst ? qtyMatch[2].trim() : qtyMatch[1].trim(),
                    quantity: parseInt(isNumFirst ? qtyMatch[1] : qtyMatch[2])
                });
            } else {
                items.push({ name: cleanLine, quantity: 1 });
            }
        } else if (currentSection === 'encounters') {
            const locationMatch = cleanLine.match(/^(.+?)\s*[(@]\s*(.+?)[)@]?\s*$/);
            encounters.push({
                name: locationMatch ? locationMatch[1].trim() : cleanLine,
                location: locationMatch ? locationMatch[2].trim() : 'Unknown',
                difficulty: extractDifficulty(cleanLine)
            });
        } else if (currentSection === 'description') {
            descLines.push(cleanLine);
        } else {
            // Unstructured text: auto-detect content
            if (cleanLine.length > 20) {
                descLines.push(cleanLine);
            }
            // Auto-detect enemies in prose
            const hasEnemy = enemyKeywords.some(k => lower.includes(k));
            if (hasEnemy && !currentSection) {
                const enemyMatch = enemyKeywords.find(k => lower.includes(k));
                if (enemyMatch && !encounters.find(e => e.name.toLowerCase().includes(enemyMatch))) {
                    encounters.push({
                        name: enemyMatch.charAt(0).toUpperCase() + enemyMatch.slice(1),
                        location: 'Unknown',
                        difficulty: extractDifficulty(line)
                    });
                }
            }
        }
    }

    return {
        title: title || 'Imported Session',
        description: descLines.slice(0, 3).join(' ') || text.substring(0, 200),
        locations,
        quests,
        items,
        encounters
    };
}

function extractDifficulty(text: string): number {
    const lower = text.toLowerCase();
    if (lower.includes('boss') || lower.includes('legendary') || lower.includes('ancient')) return 8;
    if (lower.includes('hard') || lower.includes('difficult') || lower.includes('elite')) return 5;
    if (lower.includes('medium') || lower.includes('moderate')) return 3;
    if (lower.includes('easy') || lower.includes('simple') || lower.includes('weak')) return 1;
    const match = text.match(/(\d+)/);
    return match ? Math.min(parseInt(match[1]), 10) : 3;
}

// ─── Map Generation (Free — Local Stable Diffusion) ──────────────────────────

async function generateAllMaps(locations: Array<{ name: string; description: string; order: number }>, campaignId: string) {
    const maps = [];

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        const mapUrl = await generateMapImage(location.name, location.description, campaignId, i * 2, false);
        maps.push({
            title: location.name,
            url: mapUrl,
            order: i * 2,
            description: location.description
        });

        if (i < locations.length - 1) {
            const nextLocation = locations[i + 1];
            const terrain = inferTravelTerrain(location, nextLocation);
            const travelUrl = await generateMapImage(
                `Travel: ${location.name} → ${nextLocation.name}`,
                `${terrain} path between locations`,
                campaignId,
                i * 2 + 1,
                true
            );
            maps.push({
                title: `Travel: ${location.name} → ${nextLocation.name}`,
                url: travelUrl,
                order: i * 2 + 1,
                description: `${terrain} connecting ${location.name} and ${nextLocation.name}`
            });
        }
    }

    return maps;
}

function inferTravelTerrain(from: { name: string }, to: { name: string }): string {
    const terrains = [];
    const combined = (from.name + ' ' + to.name).toLowerCase();
    if (combined.includes('forest') || combined.includes('wood')) terrains.push('dense forest path');
    if (combined.includes('mountain') || combined.includes('hill')) terrains.push('mountain trail');
    if (combined.includes('city') || combined.includes('town') || combined.includes('village')) terrains.push('cobblestone road');
    if (combined.includes('desert') || combined.includes('dune')) terrains.push('sandy desert path');
    if (combined.includes('cave') || combined.includes('dungeon') || combined.includes('underground')) terrains.push('stone corridor');
    if (combined.includes('temple') || combined.includes('castle') || combined.includes('keep')) terrains.push('grand stone hallway');
    if (combined.includes('swamp') || combined.includes('marsh')) terrains.push('boggy swampland path');
    if (combined.includes('river') || combined.includes('lake') || combined.includes('coast')) terrains.push('riverside path');
    return terrains.length > 0 ? terrains.join(', ') : 'wilderness path';
}

async function generateMapImage(title: string, description: string, campaignId: string, order: number, isTravel: boolean = false): Promise<string> {
    const basePrompt = isTravel ? buildTravelMapPrompt(description) : buildLocationMapPrompt(title, description);
    const negativePrompt = 'isometric, perspective, side view, low angle, tilted, 3d rendered perspective, blurry, low quality, text, watermark, signature, ugly, distorted, characters, people, figures, monsters visible, fog of war, ui elements, logo';

    const sdAvailable = await checkSDAvailable();

    if (sdAvailable) {
        try {
            return await callStableDiffusion(basePrompt, negativePrompt, campaignId, order);
        } catch (err) {
            console.warn('Stable Diffusion failed, using placeholder:', err);
        }
    }

    console.log(`[Map placeholder] ${title}: ${basePrompt}`);
    return `/maps/placeholder_${campaignId}_${order}.png`;
}

function buildLocationMapPrompt(name: string, description: string): string {
    return [
        'top-down view', "bird's eye view", 'looking straight down from above',
        'orthographic top-down', 'tabletop RPG battle map', 'high detail dungeon master map',
        name, description,
        'dnd map style', 'fantasy map', 'grid overlay', 'vibrant colors',
        'hand-drawn style', 'no characters', 'empty map ready for play'
    ].join(', ');
}

function buildTravelMapPrompt(terrain: string): string {
    return [
        'top-down view', "bird's eye view", 'looking straight down from above',
        'orthographic top-down', 'tabletop RPG overworld travel map',
        terrain, 'fantasy map', 'dnd travel map', 'hand-drawn style',
        'detailed terrain features', 'visible path or road', 'no characters'
    ].join(', ');
}

async function checkSDAvailable(): Promise<boolean> {
    try {
        const res = await fetch(`${SD_URL}/sdapi/v1/sd-models`, { signal: AbortSignal.timeout(2000) });
        return res.ok;
    } catch {
        return false;
    }
}

async function callStableDiffusion(prompt: string, negativePrompt: string, campaignId: string, order: number): Promise<string> {
    const payload = {
        prompt,
        negative_prompt: negativePrompt,
        steps: 30,
        cfg_scale: 7.5,
        width: 768,
        height: 768,
        sampler_name: 'DPM++ 2M Karras',
        batch_size: 1,
        n_iter: 1,
    };

    const res = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000)
    });

    if (!res.ok) throw new Error(`Stable Diffusion error: ${await res.text()}`);

    const data = await res.json();
    const base64Image = data.images?.[0];
    if (!base64Image) throw new Error('No image returned from Stable Diffusion');

    const filename = `${campaignId}/map_${order}_${Date.now()}.png`;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Use a module-level anon client for storage uploads (public bucket, no RLS)
    const storageClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: uploadError } = await storageClient.storage
        .from('campaign-maps')
        .upload(filename, imageBuffer, { contentType: 'image/png', upsert: true });

    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = storageClient.storage.from('campaign-maps').getPublicUrl(filename);
    return publicUrl;
}

// ─── Database Operations ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addMapsToCampaign(supabase: any, campaignId: string, maps: Array<{ title: string; url: string; order: number; description?: string }>) {
    const { data: campaignState } = await supabase.from('campaign_state').select('map').eq('campaign_id', campaignId).single();
    const currentQueue = campaignState?.map?.queue || [];
    await supabase.from('campaign_state').update({
        map: { url: maps[0]?.url || '', currentIndex: 0, autoProgress: true, queue: [...currentQueue, ...maps] }
    }).eq('campaign_id', campaignId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createQuests(supabase: any, campaignId: string, quests: Array<{ name: string; description: string }>) {
    if (quests.length === 0) return;
    await supabase.from('quests').insert(quests.map(q => ({ campaign_id: campaignId, title: q.name, description: q.description, status: 'active' as const })));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addItems(supabase: any, campaignId: string, items: Array<{ name: string; quantity: number }>) {
    if (items.length === 0) return;
    await supabase.from('items').insert(items.map(item => ({ campaign_id: campaignId, name: item.name, quantity: item.quantity, description: 'Found during session import' })));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createEncounters(supabase: any, campaignId: string, encounters: Array<{ name: string; location: string; difficulty: number }>) {
    if (encounters.length === 0) return;
    await supabase.from('encounters').insert(encounters.map(enc => ({ campaign_id: campaignId, name: enc.name, description: `At ${enc.location}`, difficulty: enc.difficulty, status: 'pending' as const })));
}

