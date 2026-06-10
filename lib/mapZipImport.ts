import JSZip from 'jszip';

export interface ZipMapEntry {
    id: string;
    title: string;
    group: string;
    type: string;
    relativePath: string;
    file: File;
    objectUrl: string;
}

export interface AtlasPlacement {
    mapId: string;
    title: string;
    group: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface AtlasResult {
    blob: Blob;
    width: number;
    height: number;
    placements: AtlasPlacement[];
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const TYPE_KEYWORDS: Array<{ type: string; terms: string[] }> = [
    { type: 'Tavern', terms: ['tavern', 'inn', 'pub', 'alehouse'] },
    { type: 'Shop', terms: ['shop', 'store', 'market', 'vendor'] },
    { type: 'Blacksmith', terms: ['blacksmith', 'smith', 'forge'] },
    { type: 'Town', terms: ['town', 'city', 'village', 'square', 'street'] },
    { type: 'Forest', terms: ['forest', 'woods', 'grove'] },
    { type: 'Cave', terms: ['cave', 'cavern', 'mine'] },
    { type: 'Battle', terms: ['battle', 'encounter', 'combat', 'arena'] },
    { type: 'Dungeon', terms: ['dungeon', 'crypt', 'ruin', 'temple'] },
    { type: 'Road', terms: ['road', 'trail', 'path', 'travel'] },
];

export function isSupportedMapFile(path: string) {
    const cleanPath = path.replace(/\\/g, '/');
    const filename = cleanPath.split('/').pop() || '';
    const lowerPath = cleanPath.toLowerCase();
    if (!filename || filename.startsWith('.') || cleanPath.includes('/.')) return false;
    if (lowerPath.startsWith('__macosx/') || filename.toLowerCase() === 'thumbs.db') return false;

    const extension = filename.split('.').pop()?.toLowerCase();
    return !!extension && IMAGE_EXTENSIONS.has(extension);
}

export function inferMapDetails(path: string) {
    const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = cleanPath.split('/').filter(Boolean);
    const filename = parts.pop() || cleanPath;
    const groupSource = parts.length > 0 ? parts[parts.length - 1] : 'Imported Maps';
    const title = toTitleCase(filename.replace(/\.[^.]+$/, ''));
    const group = toTitleCase(groupSource);
    const type = inferType(`${parts.join(' ')} ${filename}`);

    return { title, group, type };
}

export async function extractZipMaps(zipFile: File): Promise<ZipMapEntry[]> {
    const zip = await JSZip.loadAsync(zipFile);
    const entries: ZipMapEntry[] = [];

    for (const [relativePath, entry] of Object.entries(zip.files)) {
        if (entry.dir || !isSupportedMapFile(relativePath)) continue;

        const blob = await entry.async('blob');
        const extension = relativePath.split('.').pop()?.toLowerCase() || 'png';
        const file = new File([blob], safeFilename(relativePath), {
            type: mimeTypeForExtension(extension),
        });
        const details = inferMapDetails(relativePath);

        entries.push({
            id: crypto.randomUUID(),
            ...details,
            relativePath: relativePath.replace(/\\/g, '/'),
            file,
            objectUrl: URL.createObjectURL(file),
        });
    }

    return entries.sort((a, b) => {
        const groupCompare = a.group.localeCompare(b.group);
        if (groupCompare !== 0) return groupCompare;
        return a.title.localeCompare(b.title);
    });
}

export async function buildAtlas(entries: ZipMapEntry[]): Promise<AtlasResult> {
    if (entries.length === 0) {
        throw new Error('No maps were found in the ZIP file.');
    }

    const loaded = await Promise.all(entries.map(async (entry) => ({
        entry,
        image: await loadImage(entry.objectUrl),
    })));

    const cellWidth = 420;
    const cellHeight = 320;
    const gap = 28;
    const titleHeight = 46;
    const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(entries.length))));
    const rows = Math.ceil(entries.length / columns);
    const width = columns * cellWidth + (columns + 1) * gap;
    const height = rows * (cellHeight + titleHeight) + (rows + 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create the atlas canvas.');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(12, 12, width - 24, height - 24);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);
    ctx.font = '700 22px Arial, sans-serif';
    ctx.textBaseline = 'middle';

    const placements: AtlasPlacement[] = [];

    loaded.forEach(({ entry, image }, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = gap + col * (cellWidth + gap);
        const y = gap + row * (cellHeight + titleHeight + gap);
        const imageBoxY = y + titleHeight;
        const scale = Math.min(cellWidth / image.naturalWidth, cellHeight / image.naturalHeight);
        const drawWidth = Math.max(1, image.naturalWidth * scale);
        const drawHeight = Math.max(1, image.naturalHeight * scale);
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = imageBoxY + (cellHeight - drawHeight) / 2;

        ctx.fillStyle = '#030712';
        roundRect(ctx, x, y, cellWidth, cellHeight + titleHeight, 10);
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f9fafb';
        ctx.fillText(entry.title, x + 16, y + 18, cellWidth - 32);
        ctx.font = '500 13px Arial, sans-serif';
        ctx.fillStyle = '#d1d5db';
        ctx.fillText(`${entry.group} / ${entry.type}`, x + 16, y + 38, cellWidth - 32);
        ctx.font = '700 22px Arial, sans-serif';

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        placements.push({
            mapId: entry.id,
            title: entry.title,
            group: entry.group,
            type: entry.type,
            x: Math.round(drawX),
            y: Math.round(drawY),
            width: Math.round(drawWidth),
            height: Math.round(drawHeight),
        });
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error('Could not export the atlas image.'));
        }, 'image/png');
    });

    return { blob, width, height, placements };
}

function inferType(text: string) {
    const lower = text.toLowerCase();
    return TYPE_KEYWORDS.find(({ terms }) => terms.some(term => lower.includes(term)))?.type || 'Map';
}

function toTitleCase(value: string) {
    return value
        .replace(/^\d+[-_\s.]*/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase()) || 'Untitled Map';
}

function safeFilename(path: string) {
    return (path.split('/').pop() || 'map.png').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function mimeTypeForExtension(extension: string) {
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
    if (extension === 'webp') return 'image/webp';
    return 'image/png';
}

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Could not read one of the map images.'));
        image.src = src;
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
