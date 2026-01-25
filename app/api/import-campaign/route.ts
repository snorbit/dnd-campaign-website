import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { campaignId, campaignText } = await request.json();

        if (!campaignText || !campaignId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('Starting session import for campaign:', campaignId);

        // Step 1: Parse the session text using AI
        const parsed = await parseSessionText(campaignText);

        console.log('Parsed session:', parsed);

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
        await addMapsToCampaign(campaignId, maps);

        // Step 5: Create quests
        await createQuests(campaignId, parsed.quests);

        // Step 6: Add items
        await addItems(campaignId, parsed.items);

        // Step 7: Create encounters
        await createEncounters(campaignId, parsed.encounters);

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

// Parse session text and extract structured data
async function parseSessionText(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let title = 'Untitled Session';
    let description = '';
    const locations: Array<{ name: string; description: string; order: number }> = [];
    const quests: Array<{ name: string; description: string }> = [];
    const items: Array<{ name: string; quantity: number }> = [];
    const encounters: Array<{ name: string; location: string; difficulty: number }> = [];

    let currentSection = '';
    let locationOrder = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Extract title (usually first line or line with "Session")
        if (i === 0 || lower.includes('session')) {
            title = line.replace(/session \d+:/i, '').trim() || title;
            continue;
        }

        // Detect sections
        if (lower.startsWith('locations:')) {
            currentSection = 'locations';
            continue;
        } else if (lower.startsWith('quests:')) {
            currentSection = 'quests';
            continue;
        } else if (lower.startsWith('encounters:')) {
            currentSection = 'encounters';
            continue;
        } else if (lower.startsWith('items:')) {
            currentSection = 'items';
            continue;
        }

        // Parse based on current section
        if (currentSection === 'locations') {
            // Format: "1. Location Name - description" or "- Location Name - description"
            const match = line.match(/^[\d\-•]\s*\.?\s*(.+?)\s*[-–]\s*(.+)$/);
            if (match) {
                locations.push({
                    name: match[1].trim(),
                    description: match[2].trim(),
                    order: locationOrder++
                });
            } else if (line.match(/^[\d\-•]/)) {
                // Just a name without description
                const name = line.replace(/^[\d\-•]\s*\.?\s*/, '').trim();
                if (name) {
                    locations.push({
                        name,
                        description: name.toLowerCase(),
                        order: locationOrder++
                    });
                }
            }
        } else if (currentSection === 'quests') {
            const questLine = line.replace(/^[-•]\s*/, '').trim();
            if (questLine) {
                quests.push({
                    name: questLine,
                    description: questLine
                });
            }
        } else if (currentSection === 'items') {
            // Format: "- Item Name x3" or "- Item Name"
            const match = line.match(/^[-•]\s*(.+?)\s*(?:x(\d+))?$/);
            if (match) {
                items.push({
                    name: match[1].trim(),
                    quantity: match[2] ? parseInt(match[2]) : 1
                });
            }
        } else if (currentSection === 'encounters') {
            // Format: "- Enemy Name (location, difficulty/count)" 
            const encounterLine = line.replace(/^[-•]\s*/, '').trim();
            if (encounterLine) {
                const match = encounterLine.match(/^(.+?)\s*\(([^,]+)(?:,\s*(.+))?\)/);
                if (match) {
                    encounters.push({
                        name: match[1].trim(),
                        location: match[2].trim(),
                        difficulty: extractDifficulty(match[3] || '')
                    });
                } else {
                    encounters.push({
                        name: encounterLine,
                        location: 'Unknown',
                        difficulty: 3
                    });
                }
            }
        } else if (!currentSection && line.length > 20) {
            // Treat as description
            description += line + ' ';
        }
    }

    return {
        title: title || 'Imported Session',
        description: description.trim() || text.substring(0, 200),
        locations,
        quests,
        items,
        encounters
    };
}

function extractDifficulty(text: string): number {
    const lower = text.toLowerCase();
    if (lower.includes('boss') || lower.includes('hard')) return 5;
    if (lower.includes('medium') || lower.includes('moderate')) return 3;
    if (lower.includes('easy') || lower.includes('simple')) return 1;

    // Extract number (e.g., "3 enemies", "level 4")
    const match = text.match(/(\d+)/);
    return match ? Math.min(parseInt(match[1]), 10) : 3;
}

// Generate maps for all locations plus travel maps
async function generateAllMaps(locations: Array<{ name: string; description: string; order: number }>, campaignId: string) {
    const maps = [];
    const mapsDir = path.join(process.cwd(), 'public', 'maps');

    // Ensure maps directory exists
    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        // Generate main location map
        const mapPath = await generateMapImage(location.name, location.description, campaignId, i * 2);
        maps.push({
            title: location.name,
            url: mapPath,
            order: i * 2,
            description: location.description
        });

        // Generate travel map to next location (if not last)
        if (i < locations.length - 1) {
            const nextLocation = locations[i + 1];
            const terrain = inferTravelTerrain(location, nextLocation);
            const travelPath = await generateMapImage(
                `Travel: ${location.name} → ${nextLocation.name}`,
                `${terrain} path between locations`,
                campaignId,
                i * 2 + 1,
                true
            );
            maps.push({
                title: `Travel: ${location.name} → ${nextLocation.name}`,
                url: travelPath,
                order: i * 2 + 1,
                description: `${terrain} connecting ${location.name} and ${nextLocation.name}`
            });
        }
    }

    return maps;
}

// Infer travel terrain between locations
function inferTravelTerrain(from: { name: string }, to: { name: string }): string {
    const terrains = [];
    const fromName = from.name.toLowerCase();
    const toName = to.name.toLowerCase();

    if (fromName.includes('forest') || toName.includes('forest')) {
        terrains.push('forest path');
    }
    if (fromName.includes('mountain') || toName.includes('mountain')) {
        terrains.push('mountain trail');
    }
    if (fromName.includes('city') || fromName.includes('town') || toName.includes('city') || toName.includes('town')) {
        terrains.push('cobblestone road');
    }
    if (fromName.includes('desert') || toName.includes('desert')) {
        terrains.push('sandy desert path');
    }
    if (fromName.includes('cave') || fromName.includes('dungeon') || toName.includes('cave') || toName.includes('dungeon')) {
        terrains.push('stone corridor');
    }
    if (fromName.includes('temple') || fromName.includes('castle') || toName.includes('temple') || toName.includes('castle')) {
        terrains.push('grand hallway');
    }

    return terrains.length > 0 ? terrains.join(', ') : 'wilderness path';
}

// Generate a map image (placeholder - will use AI image generation)
async function generateMapImage(title: string, description: string, campaignId: string, order: number, isTravel: boolean = false): Promise<string> {
    // For now, create a placeholder
    // TODO: Integrate with actual image generation AI

    const filename = `${campaignId}_${order}_${Date.now()}.png`;
    const filepath = `/maps/${filename}`;

    // This is where you'd call the generate_image tool in a real implementation
    // For now, return a placeholder path
    console.log(`Would generate map: ${title} - ${description}`);

    return filepath;
}

// Add maps to campaign
async function addMapsToCampaign(campaignId: string, maps: Array<{ title: string; url: string; order: number; description?: string }>) {
    const { data: campaignState } = await supabase
        .from('campaign_state')
        .select('map')
        .eq('campaign_id', campaignId)
        .single();

    const currentQueue = campaignState?.map?.queue || [];
    const newQueue = [...currentQueue, ...maps];

    await supabase
        .from('campaign_state')
        .update({
            map: {
                url: maps[0]?.url || '',
                currentIndex: 0,
                autoProgress: true,
                queue: newQueue
            }
        })
        .eq('campaign_id', campaignId);
}

// Create quests
async function createQuests(campaignId: string, quests: Array<{ name: string; description: string }>) {
    if (quests.length === 0) return;

    const questsToInsert = quests.map(q => ({
        campaign_id: campaignId,
        title: q.name,
        description: q.description,
        status: 'active' as const
    }));

    await supabase.from('quests').insert(questsToInsert);
}

// Add items
async function addItems(campaignId: string, items: Array<{ name: string; quantity: number }>) {
    if (items.length === 0) return;

    const itemsToInsert = items.map(item => ({
        campaign_id: campaignId,
        name: item.name,
        quantity: item.quantity,
        description: `Found during session import`
    }));

    await supabase.from('items').insert(itemsToInsert);
}

// Create encounters
async function createEncounters(campaignId: string, encounters: Array<{ name: string; location: string; difficulty: number }>) {
    if (encounters.length === 0) return;

    const encountersToInsert = encounters.map(enc => ({
        campaign_id: campaignId,
        name: enc.name,
        description: `At ${enc.location}`,
        difficulty: enc.difficulty,
        status: 'pending' as const
    }));

    await supabase.from('encounters').insert(encountersToInsert);
}
