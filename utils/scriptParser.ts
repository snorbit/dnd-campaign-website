export interface ScriptLocation {
    title: string;
    description: string;
    keywords: string[];
}

export function parseScript(content: string): ScriptLocation[] {
    // 1. Normalize line endings
    const normalized = content.replace(/\r\n/g, '\n');

    // 2. Split by "## " headers (Lookahead ensuring we keep the delimiter if we wanted, but split is easier)
    // We split by the regex pattern for a header start
    const sections = normalized.split(/(?=^## )/gm);

    const locations: ScriptLocation[] = [];

    sections.forEach(section => {
        const trimmed = section.trim();
        if (!trimmed) return;

        // Check if this is actually a header section
        if (trimmed.startsWith("## ")) {
            const firstLineEnd = trimmed.indexOf('\n');
            if (firstLineEnd === -1) return; // Weird single line case

            const title = trimmed.slice(3, firstLineEnd).trim(); // Remove "## "
            const body = trimmed.slice(firstLineEnd).trim();

            // Extract "Read Aloud" block if present, or use whole body if short
            let description = "";

            const readAloudMatch = body.match(/\*\*Read Aloud.*?\*\*\n([\s\S]*?)(?=\n\s*(?:##|\*\*|$))/i);
            if (readAloudMatch && readAloudMatch[1]) {
                description = readAloudMatch[1].trim();
            } else {
                // Fallback: If no explicit read aloud, take the first paragraph or the whole thing if distinct
                description = body.split('\n\n')[0].trim();
            }

            // Cleanup quotes and artifacts
            description = description.replace(/^["']|["']$/g, '');

            if (title && description) {
                locations.push({
                    title,
                    description,
                    keywords: [title, "fantasy", "battlemap"]
                });
            }
        }
    });

    return locations;
}
