import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateProceduralMap, detectMapType } from '@/lib/mapGenerator';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { campaignId, campaignText } = await request.json();

        if (!campaignText || !campaignId) {
            console.error('Missing required fields:', { campaignId: !!campaignId, campaignText: !!campaignText });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('✓ Starting session import for campaign:', campaignId);

        // Step 1: Parse the session text
        let parsed;
        try {
            parsed = await parseSessionText(campaignText);
            console.log('✓ Parsed session successfully:', {
                title: parsed.title,
                locations: parsed.locations.length,
                quests: parsed.quests.length,
                items: parsed.items.length,
                encounters: parsed.encounters.length
            });
        } catch (parseError) {
            console.error('✗ Parse error:', parseError);
            throw new Error('Failed to parse session text: ' + (parseError as Error).message);
        }

        // Step 2: Generate maps for each location + travel maps
        let maps;
        try {
            maps = await generateAllMaps(parsed.locations, campaignId);
            console.log('✓ Generated maps:', maps.length);
        } catch (mapError) {
            console.error('✗ Map generation error:', mapError);
            throw new Error('Failed to generate maps: ' + (mapError as Error).message);
        }

        // Step 3: Save session to database
        let session;
        try {
            const { data, error: sessionError } = await supabase
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

            if (sessionError) {
                console.error('✗ Database error saving session:', sessionError);
                throw sessionError;
            }
            session = data;
            console.log('✓ Saved session to database:', session.id);
        } catch (dbError) {
            console.error('✗ Session save error:', dbError);
            throw new Error('Failed to save session: ' + (dbError as Error).message);
        }

        // Step 4-7: Create all content (non-fatal errors)
        try {
            await addMapsToCampaign(campaignId, maps);
            console.log('✓ Added maps to campaign');
        } catch (error) {
            console.warn('⚠ Could not add maps to campaign:', error);
        }

        try {
            await createQuests(campaignId, parsed.quests);
            console.log('✓ Created quests');
        } catch (error) {
            console.warn('⚠ Could not create quests:', error);
        }

        try {
            await addItems(campaignId, parsed.items);
            console.log('✓ Added items');
        } catch (error) {
            console.warn('⚠ Could not add items:', error);
        }

        try {
            await createEncounters(campaignId, parsed.encounters);
            console.log('✓ Created encounters');
        } catch (error) {
            console.warn('⚠ Could not create encounters:', error);
        }

        const summary = `✅ Session imported successfully!

📍 ${maps.length} maps generated (${parsed.locations.length} locations + ${maps.length - parsed.locations.length} travel maps)
📜 ${parsed.quests.length} quests created
🎒 ${parsed.items.length} items added  
⚔️ ${parsed.encounters.length} encounters created

Your session "${parsed.title}" is ready to play!`;

        console.log('✓ Import complete!');

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
        console.error('✗ FATAL ERROR importing session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to import session: ' + errorMessage },
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
            const match = line.match(/^[\d\-•]\s*\.?\s*(.+?)\s*[-–]\s*(.+)$/);
            if (match) {
                locations.push({
                    name: match[1].trim(),
                    description: match[2].trim(),
                    order: locationOrder++
                });
            } else if (line.match(/^[\d\-•]/)) {
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
            const match = line.match(/^[-•]\s*(.+?)\s*(?:x(\d+))?$/);
            if (match) {
                items.push({
                    name: match[1].trim(),
                    quantity: match[2] ? parseInt(match[2]) : 1
                });
            }
        } else if (currentSection === 'encounters') {
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

    const match = text.match(/(\d+)/);
    return match ? Math.min(parseInt(match[1]), 10) : 3;
}

// Generate maps for all locations plus travel maps
async function generateAllMaps(locations: Array<{ name: string; description: string; order: number }>, campaignId: string) {
    const maps = [];

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        // Generate main location map
        console.log(`Generating map for: ${location.name}`);
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
            console.log(`Generating travel map: ${location.name} → ${nextLocation.name}`);
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

// Generate a map image using procedural generator
async function generateMapImage(title: string, description: string, campaignId: string, order: number, isTravel: boolean = false): Promise<string> {
    try {
        // Detect map type from description
        const mapType = detectMapType(description);

        console.log(`  → Detected type: ${mapType}`);

        // Generate map using procedural generator
        const imageUrl = await generateProceduralMap({
            type: mapType as any,
            description
        });

        console.log(`  ✓ Map generated: ${imageUrl}`);
        return imageUrl;

    } catch (error) {
        console.error('Error generating map image:', error);
        return `/maps/placeholder_${order}.png`;
    }
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
