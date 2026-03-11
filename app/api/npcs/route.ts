import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const npcDir = path.join(process.cwd(), "data", "DnD campign", "NPC's");

        if (!fs.existsSync(npcDir)) {
            return NextResponse.json({ npcs: [], error: 'Directory not found' });
        }

        const files = fs.readdirSync(npcDir).filter(f => f.endsWith('.md'));
        const allNpcs: any[] = [];

        for (const file of files) {
            const content = fs.readFileSync(path.join(npcDir, file), 'utf-8');
            const lines = content.split('\n');
            let currentNpc: any = null;
            let currentListType: string | null = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // New Character detected (## Character Name or ### Character Name)
                if (line.match(/^#{2,3}\s+(.+)$/)) {
                    if (currentNpc) {
                        allNpcs.push(currentNpc);
                    }
                    // Strip the <a name="..."></a> anchor if it exists
                    const rawName = line.replace(/^#{2,3}\s+/, '');
                    const cleanName = rawName.replace(/<a name="[^"]*"><\/a>/g, '').trim();

                    // Ignore category headers like "## Quest Allies"
                    if (['Quest Givers', 'Quest Targets', 'Quest Allies', 'Quest Enemies', 'Mystery Quests', 'Combat Quests', 'Political Quests', 'Personal Quests'].includes(cleanName) || line.includes('Quests') || line.includes('Session 1')) {
                        currentNpc = null;
                        continue;
                    }

                    currentNpc = {
                        id: crypto.randomUUID(),
                        name: cleanName,
                        sourceGroup: file.replace('.md', '').replace(/_/g, ' '),
                        details: {},
                        traits: [],
                        isCustom: true
                    };
                    currentListType = null;
                    continue;
                }

                if (!currentNpc) continue;

                // Property matching: - **Key**: Value
                const propMatch = line.match(/^- \*\*([^]+?)\*\*:\s*(.*)$/);
                if (propMatch) {
                    const key = propMatch[1].toLowerCase().trim();
                    const value = propMatch[2].trim();
                    if (value) {
                        currentNpc.details[key] = value;
                    } else {
                        // Might be the start of a multi-line list like "Hooks" or "Quests"
                        currentListType = key;
                        currentNpc.details[key] = [];
                    }
                    continue;
                }

                // Append to Multi-line list (like hooks, quests)
                if (currentListType && line.startsWith('- ')) {
                    const listItem = line.substring(2).trim();
                    if (listItem) {
                        currentNpc.details[currentListType].push(listItem);
                    }
                    continue;
                }

                // Empty line might break current list type, but keep accumulating until next property
                if (line === '') continue;
            }

            if (currentNpc) {
                allNpcs.push(currentNpc);
            }
        }

        // Clean up arrays into strings if needed, or map to standard NPC trait formats
        const formattedNpcs = allNpcs.map(npc => {
            const traits = [];
            if (npc.details.personality) traits.push(`Personality: ${npc.details.personality}`);
            if (npc.details.role) traits.push(`Role: ${npc.details.role}`);
            if (npc.details.location) traits.push(`Location: ${npc.details.location}`);
            if (npc.details.affiliation) traits.push(`Affiliation: ${npc.details.affiliation}`);

            // Convert list properties back to readable text
            let description = '';
            const listsToProcess = ['hooks', 'quests', 'threats', 'vulnerabilities', 'assistance', 'involvement'];

            for (const listName of listsToProcess) {
                if (npc.details[listName] && Array.isArray(npc.details[listName]) && npc.details[listName].length > 0) {
                    description += `\n\n**${listName.charAt(0).toUpperCase() + listName.slice(1)}**:\n`;
                    description += npc.details[listName].map((item: string) => `- ${item}`).join('\n');
                }
            }

            return {
                id: npc.id,
                name: npc.name,
                type: npc.sourceGroup,
                personality: npc.details.personality || 'Unknown',
                appearance: npc.details.appearance || 'Standard',
                description: description.trim() || 'Custom NPC imported from local files.',
                traits: traits,
                isCustom: true
            };
        });

        // Add 5 generic NPCs to populate the list if the user wants randomization too
        const names = ["Thorin Ironfoot", "Elara Moonwhisper", "Garrick the Swift", "Sylas Grim", "Lyra Dawnbringer"];
        const genericNpcs = names.map(name => ({
            id: crypto.randomUUID(),
            name: name,
            type: "Generated Civilian",
            personality: "Friendly but cautious.",
            appearance: "Wears modest traveler's clothes.",
            description: "A local denizen generated by the system.",
            traits: ["Neutral", "Commoner", "Local knowledge"],
            isCustom: false
        }));

        return NextResponse.json({ npcs: [...formattedNpcs, ...genericNpcs] });

    } catch (error: any) {
        console.error("NPC Parse error:", error);
        return NextResponse.json({ npcs: [], error: error.message || 'Unknown error' }, { status: 500 });
    }
}
