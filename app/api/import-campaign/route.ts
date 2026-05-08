import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { generateBattleMap } from '@/lib/mapGenerationService';
import {
    ParsedSession,
    SessionMapJob,
    buildEncounterRecords,
    buildItemRecords,
    buildNPCRecords,
    buildQuestRecords,
    buildSessionMapJobs,
    countEncounterMonsters,
    normalizeParsedSession,
    parseSessionWithSmartRegex,
} from '@/lib/sessionImport';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

function createAuthClient(token: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - missing auth token' }, { status: 401 });
        }

        const { campaignId, campaignText } = await request.json();
        if (!campaignId || !campaignText?.trim()) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAuthClient(token);
        const parsed = await parseSessionText(campaignText);
        const mapJobs = buildSessionMapJobs(parsed);
        const maps = await generateSessionMaps(mapJobs, campaignId);
        const npcs = buildNPCRecords(parsed.npcs);
        const quests = buildQuestRecords(parsed.quests);
        const items = buildItemRecords(parsed.items);
        const encounters = buildEncounterRecords(parsed.encounters);
        const monsterCount = countEncounterMonsters(parsed.encounters);

        const sessionDescription = [
            parsed.description,
            `Generated: ${maps.length} maps, ${quests.length} quests, ${items.length} items, ${npcs.length} NPCs, ${encounters.length} encounters, ${monsterCount} monsters.`,
        ].filter(Boolean).join('\n\n');

        const { error: sessionError } = await supabase
            .from('campaign_sessions')
            .insert({
                campaign_id: campaignId,
                title: parsed.title || 'Imported Session',
                description: sessionDescription,
                session_text: campaignText,
                maps_generated: maps.length,
                quests_created: quests.length,
                items_added: items.length,
                encounters_created: encounters.length,
            });

        if (sessionError) throw sessionError;

        await appendGeneratedContent(supabase, campaignId, {
            maps,
            quests,
            items,
            npcs,
            encounters,
        });

        const summary = [
            'Session imported successfully.',
            `${maps.length} maps generated for the full session.`,
            `${npcs.length} NPCs created.`,
            `${encounters.length} encounters created with ${monsterCount} monster tokens/stat blocks.`,
            `${quests.length} quests created.`,
            `${items.length} items added.`,
        ].join('\n');

        return NextResponse.json({
            success: true,
            summary,
            generated: {
                maps: maps.length,
                quests: quests.length,
                items: items.length,
                npcs: npcs.length,
                encounters: encounters.length,
                monsters: monsterCount,
            },
        });
    } catch (error) {
        console.error('Error importing session:', error);
        return NextResponse.json(
            { error: `Failed to import session: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

async function parseSessionText(text: string): Promise<ParsedSession> {
    if (await checkOllamaAvailable()) {
        try {
            return await parseWithOllama(text);
        } catch (error) {
            console.warn('Ollama parsing failed, using deterministic parser:', error);
        }
    }

    return parseSessionWithSmartRegex(text);
}

async function checkOllamaAvailable() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            signal: AbortSignal.timeout(2000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function parseWithOllama(text: string): Promise<ParsedSession> {
    const systemPrompt = `You extract D&D session prep into JSON.
Return only raw JSON with this exact shape:
{
  "title": "Session title",
  "description": "Short session summary",
  "locations": [{"name": "Location name", "description": "Top-down battle map description", "order": 0}],
  "quests": [{"name": "Quest title", "description": "Quest goal"}],
  "items": [{"name": "Item name", "quantity": 1}],
  "npcs": [{"name": "NPC name", "race": "Race or Unknown", "role": "Role", "notes": "Useful roleplay notes"}],
  "encounters": [{
    "name": "Encounter name",
    "location": "Where it happens",
    "difficulty": 3,
    "monsters": [{"name": "Monster name", "count": 1, "hp": 7, "ac": 15}]
  }]
}
Difficulty scale: 1 easy, 3 moderate, 5 hard, 8 boss. Extract every useful NPC, monster, encounter, and location.`;

    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Parse this D&D session:\n\n${text}` },
            ],
            temperature: 0.2,
            stream: false,
        }),
        signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content from Ollama');

    const jsonText = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return normalizeParsedSession(JSON.parse(jsonText), text);
}

async function generateSessionMaps(jobs: SessionMapJob[], campaignId: string) {
    const maps = [];

    for (const job of jobs) {
        const generated = await generateBattleMap({
            prompt: job.prompt,
            title: job.title,
            campaignId,
            mapType: job.mapType,
            width: 1024,
            height: 1024,
            gridSize: 32,
            includeGrid: true,
        });

        maps.push({
            id: crypto.randomUUID(),
            title: job.title,
            url: generated.imageUrl,
            order: job.order,
            description: job.description,
            source: generated.source,
            metadata: {
                ...generated.metadata,
                kind: job.kind,
            },
        });
    }

    return maps;
}

async function appendGeneratedContent(
    supabase: SupabaseClient,
    campaignId: string,
    content: {
        maps: unknown[];
        quests: unknown[];
        items: unknown[];
        npcs: unknown[];
        encounters: unknown[];
    }
) {
    const { data, error } = await supabase
        .from('campaign_state')
        .select('map, quests, items, npcs, encounters')
        .eq('campaign_id', campaignId)
        .single();

    if (error) throw error;

    const currentMap = data?.map || {};
    const currentQueue = Array.isArray(currentMap.queue) ? currentMap.queue : [];
    const firstMap = (content.maps[0] as { url?: string } | undefined)?.url || currentMap.url || '';

    const update = {
        map: {
            ...currentMap,
            url: firstMap,
            currentIndex: currentMap.currentIndex || 0,
            autoProgress: true,
            queue: [...currentQueue, ...content.maps],
        },
        quests: [...asArray(data?.quests), ...content.quests],
        items: [...asArray(data?.items), ...content.items],
        npcs: [...asArray(data?.npcs), ...content.npcs],
        encounters: [...asArray(data?.encounters), ...content.encounters],
    };

    const { error: updateError } = await supabase
        .from('campaign_state')
        .update(update)
        .eq('campaign_id', campaignId);

    if (updateError) throw updateError;
}

function asArray(value: unknown) {
    return Array.isArray(value) ? value : [];
}
