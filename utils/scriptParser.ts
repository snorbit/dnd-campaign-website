export interface ScriptLocation {
    title: string;
    description: string;
    keywords: string[];
}

export function parseScript(content: string): ScriptLocation[] {
    const locations: ScriptLocation[] = [];
    const lines = content.split('\n');

    let currentTitle = "";
    let captureNextBlock = false;
    let currentDescription = "";

    // Simple parser: Looks for "## [Title]" and "**Read Aloud (Surroundings)**"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("## ")) {
            currentTitle = line.replace("## ", "").trim();
        }

        if (line.includes("**Read Aloud (Surroundings)**")) {
            captureNextBlock = true;
            currentDescription = "";
            continue;
        }

        if (captureNextBlock) {
            // End of block detection (empty line or next header or next bold block)
            if (line === "" && currentDescription.length > 0) {
                // End of description
                if (currentTitle && currentDescription) {
                    locations.push({
                        title: currentTitle,
                        description: currentDescription.replace(/"/g, '').trim(), // Remove quotes
                        keywords: extractKeywords(currentDescription)
                    });
                }
                captureNextBlock = false;
            } else if (line.startsWith("**") || line.startsWith("##")) {
                // Safety break
                if (currentTitle && currentDescription) {
                    locations.push({
                        title: currentTitle,
                        description: currentDescription.replace(/"/g, '').trim(),
                        keywords: extractKeywords(currentDescription)
                    });
                }
                captureNextBlock = false;
            } else {
                currentDescription += line + " ";
            }
        }
    }

    return locations;
}

function extractKeywords(text: string): string[] {
    // Simple mock keyword extractor - real one would use NLP or list
    // For now, just return raw description chunks or simplified tokens
    // We'll rely on Pollinations AI to handle the full sentence nicely.
    return [text.slice(0, 50)];
}
