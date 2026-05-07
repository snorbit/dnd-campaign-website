export type ProceduralMapType =
    | 'auto'
    | 'tavern'
    | 'forest'
    | 'dungeon'
    | 'desert'
    | 'cave'
    | 'castle'
    | 'town'
    | 'road'
    | 'boss-arena';

export interface ProceduralMapOptions {
    prompt: string;
    mapType?: ProceduralMapType;
    width?: number;
    height?: number;
    gridSize?: number;
    includeGrid?: boolean;
    mood?: string;
}

export interface ProceduralMapResult {
    svg: string;
    mapType: Exclude<ProceduralMapType, 'auto'>;
    metadata: {
        width: number;
        height: number;
        gridSize: number;
        prompt: string;
        mood: string;
    };
}

const DEFAULT_SIZE = 1024;
const DEFAULT_GRID = 32;

export function detectProceduralMapType(prompt: string, requested: ProceduralMapType = 'auto'): Exclude<ProceduralMapType, 'auto'> {
    if (requested !== 'auto') return requested;

    const lower = prompt.toLowerCase();
    if (lower.includes('tavern') || lower.includes('inn') || lower.includes('bar')) return 'tavern';
    if (lower.includes('forest') || lower.includes('wood') || lower.includes('grove')) return 'forest';
    if (lower.includes('desert') || lower.includes('sand') || lower.includes('dune')) return 'desert';
    if (lower.includes('cave') || lower.includes('cavern') || lower.includes('underground')) return 'cave';
    if (lower.includes('castle') || lower.includes('keep') || lower.includes('throne')) return 'castle';
    if (lower.includes('town') || lower.includes('village') || lower.includes('market')) return 'town';
    if (lower.includes('road') || lower.includes('trail') || lower.includes('path')) return 'road';
    if (lower.includes('boss') || lower.includes('arena') || lower.includes('altar')) return 'boss-arena';
    return 'dungeon';
}

export function generateProceduralMapSvg(options: ProceduralMapOptions): ProceduralMapResult {
    const width = clampSize(options.width ?? DEFAULT_SIZE);
    const height = clampSize(options.height ?? DEFAULT_SIZE);
    const gridSize = clampGrid(options.gridSize ?? DEFAULT_GRID);
    const mapType = detectProceduralMapType(options.prompt, options.mapType ?? 'auto');
    const rng = seededRandom(hashString(`${options.prompt}:${mapType}:${width}:${height}`));
    const mood = options.mood?.trim() || 'neutral';

    const elements: string[] = [
        `<rect width="${width}" height="${height}" fill="${baseColor(mapType)}"/>`,
        ...texture(mapType, width, height, rng),
        ...features(mapType, width, height, gridSize, rng),
    ];

    if (options.includeGrid !== false) {
        elements.push(grid(width, height, gridSize));
    }

    elements.push(
        `<rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="8"/>`,
        `<metadata>${escapeXml(JSON.stringify({ prompt: options.prompt, mapType, mood }))}</metadata>`
    );

    return {
        svg: [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(mapType)} battle map">`,
            `<defs><filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter></defs>`,
            ...elements,
            '</svg>',
        ].join(''),
        mapType,
        metadata: { width, height, gridSize, prompt: options.prompt, mood },
    };
}

function features(type: Exclude<ProceduralMapType, 'auto'>, width: number, height: number, cell: number, rng: () => number) {
    switch (type) {
        case 'tavern':
            return tavern(width, height, cell);
        case 'forest':
            return forest(width, height, cell, rng);
        case 'desert':
            return desert(width, height, cell, rng);
        case 'cave':
            return cave(width, height, cell, rng);
        case 'castle':
            return castle(width, height, cell);
        case 'town':
            return town(width, height, cell, rng);
        case 'road':
            return road(width, height, cell, rng);
        case 'boss-arena':
            return bossArena(width, height, cell);
        case 'dungeon':
        default:
            return dungeon(width, height, cell);
    }
}

function tavern(width: number, height: number, cell: number) {
    const tables = [
        [6, 8, 4, 2], [20, 8, 4, 2], [6, 20, 4, 2], [20, 20, 4, 2],
    ];
    return [
        rect(0, 0, width, cell * 2, '#4b2f18'),
        rect(0, 0, cell * 2, height, '#4b2f18'),
        rect(width - cell * 2, 0, cell * 2, height, '#4b2f18'),
        rect(0, height - cell * 2, width, cell * 2, '#4b2f18'),
        rect(cell * 24, cell * 13, cell * 6, cell * 10, '#6d3f1c'),
        rect(cell * 14, cell * 2, cell * 4, cell * 3, '#26211f'),
        rect(cell * 15, cell * 3, cell * 2, cell, '#ff7a1a'),
        ...tables.flatMap(([x, y, w, h]) => [
            rect(x * cell, y * cell, w * cell, h * cell, '#5a3824'),
            rect((x + 1) * cell, (y - 1) * cell, cell, cell, '#70492b'),
            rect((x + 1) * cell, (y + h) * cell, cell, cell, '#70492b'),
            rect((x - 1) * cell, (y + 0.5) * cell, cell, cell, '#70492b'),
            rect((x + w) * cell, (y + 0.5) * cell, cell, cell, '#70492b'),
        ]),
    ];
}

function dungeon(width: number, height: number, cell: number) {
    return [
        ...stoneTiles(width, height, cell),
        rect(0, 0, width, cell * 3, '#252525'),
        rect(0, 0, cell * 3, height, '#252525'),
        rect(width - cell * 3, 0, cell * 3, height, '#252525'),
        rect(0, height - cell * 3, width, cell * 3, '#252525'),
        rect(cell * 8, cell * 8, cell * 2, cell * 2, '#5f5f5f'),
        rect(cell * 22, cell * 8, cell * 2, cell * 2, '#5f5f5f'),
        rect(cell * 8, cell * 22, cell * 2, cell * 2, '#5f5f5f'),
        rect(cell * 22, cell * 22, cell * 2, cell * 2, '#5f5f5f'),
        rect(cell * 15, cell * 27, cell * 2, cell, '#7a421f'),
    ];
}

function forest(width: number, height: number, cell: number, rng: () => number) {
    const path = `<path d="M ${width * .42} 0 C ${width * .62} ${height * .25}, ${width * .35} ${height * .55}, ${width * .55} ${height}" fill="none" stroke="#8b7355" stroke-width="${cell * 6}" stroke-linecap="round"/>`;
    const trees = Array.from({ length: 58 }, () => {
        const x = rng() * width;
        const y = rng() * height;
        if (Math.abs(x - width * .5) < cell * 4 && y > height * .15 && y < height * .9) return '';
        return circle(x, y, cell * (1 + rng() * .8), '#183f24') + rect(x - 4, y, 8, cell, '#51351d');
    });
    return [path, ...trees];
}

function desert(width: number, height: number, cell: number, rng: () => number) {
    return [
        ...Array.from({ length: 12 }, (_, i) => `<path d="M 0 ${i * cell * 3 + rng() * cell} C ${width * .25} ${i * cell * 3 - cell}, ${width * .55} ${i * cell * 3 + cell * 2}, ${width} ${i * cell * 3}" fill="none" stroke="#d9ad72" stroke-width="${cell * 1.5}" opacity=".45"/>`),
        ...Array.from({ length: 18 }, () => rect(rng() * width, rng() * height, cell * (1 + rng()), cell * (0.5 + rng()), '#8f7a5a')),
        rect(cell * 10, cell * 10, cell * 12, cell, '#777067'),
        rect(cell * 10, cell * 10, cell, cell * 8, '#777067'),
        rect(cell * 21, cell * 10, cell, cell * 8, '#777067'),
    ];
}

function cave(width: number, height: number, cell: number, rng: () => number) {
    const blobs = Array.from({ length: 20 }, () => circle(width * (.2 + rng() * .6), height * (.2 + rng() * .6), cell * (3 + rng() * 5), '#3a3a3a'));
    const crystals = Array.from({ length: 10 }, () => {
        const x = width * (.15 + rng() * .7);
        const y = height * (.15 + rng() * .7);
        return `<polygon points="${x},${y - cell} ${x + cell * .6},${y} ${x},${y + cell} ${x - cell * .6},${y}" fill="#22d3ee" opacity=".8"/>`;
    });
    return [...blobs, circle(width / 2, height / 2, cell * 4, '#1d4ed8'), ...crystals];
}

function castle(width: number, height: number, cell: number) {
    return [
        ...stoneTiles(width, height, cell),
        rect(0, 0, width, cell * 4, '#4f4f4f'),
        rect(0, 0, cell * 4, height, '#4f4f4f'),
        rect(width - cell * 4, 0, cell * 4, height, '#4f4f4f'),
        rect(0, height - cell * 4, width, cell * 4, '#4f4f4f'),
        rect(width / 2 - cell * 2, cell * 4, cell * 4, cell * 4, '#b8860b'),
        rect(width / 2 - cell * 2, cell * 8, cell * 4, height - cell * 12, '#8b0000'),
        rect(cell * 6, cell * 2, cell, cell * 3, '#1e3a8a'),
        rect(width - cell * 7, cell * 2, cell, cell * 3, '#1e3a8a'),
    ];
}

function town(width: number, height: number, cell: number, rng: () => number) {
    const buildings = Array.from({ length: 18 }, () => {
        const x = Math.floor(rng() * 26 + 2) * cell;
        const y = Math.floor(rng() * 24 + 3) * cell;
        return rect(x, y, cell * (2 + Math.floor(rng() * 3)), cell * (2 + Math.floor(rng() * 3)), '#7c4a2d');
    });
    return [
        `<path d="M 0 ${height * .52} C ${width * .3} ${height * .45}, ${width * .62} ${height * .6}, ${width} ${height * .5}" fill="none" stroke="#8b7355" stroke-width="${cell * 4}"/>`,
        `<path d="M ${width * .5} 0 C ${width * .45} ${height * .35}, ${width * .6} ${height * .65}, ${width * .5} ${height}" fill="none" stroke="#8b7355" stroke-width="${cell * 3}"/>`,
        ...buildings,
        circle(width / 2, height / 2, cell * 2.2, '#64748b'),
    ];
}

function road(width: number, height: number, cell: number, rng: () => number) {
    return [
        `<path d="M ${width * .15} 0 C ${width * .65} ${height * .25}, ${width * .3} ${height * .6}, ${width * .85} ${height}" fill="none" stroke="#7c6547" stroke-width="${cell * 5}" stroke-linecap="round"/>`,
        ...Array.from({ length: 34 }, () => circle(rng() * width, rng() * height, cell * (.6 + rng()), rng() > .5 ? '#234a2a' : '#576b35')),
        rect(width * .43, height * .45, cell * 4, cell, '#5f4b32'),
    ];
}

function bossArena(width: number, height: number, cell: number) {
    return [
        circle(width / 2, height / 2, cell * 12, '#44403c'),
        circle(width / 2, height / 2, cell * 7, '#292524'),
        circle(width / 2, height / 2, cell * 2.5, '#7f1d1d'),
        rect(width / 2 - cell * 1.5, cell * 4, cell * 3, cell * 6, '#57534e'),
        rect(width / 2 - cell * 1.5, height - cell * 10, cell * 3, cell * 6, '#57534e'),
        rect(cell * 4, height / 2 - cell * 1.5, cell * 6, cell * 3, '#57534e'),
        rect(width - cell * 10, height / 2 - cell * 1.5, cell * 6, cell * 3, '#57534e'),
    ];
}

function texture(type: Exclude<ProceduralMapType, 'auto'>, width: number, height: number, rng: () => number) {
    const color = type === 'forest' ? '#315c2c' : type === 'desert' ? '#c99354' : 'rgba(255,255,255,.08)';
    return Array.from({ length: 80 }, () => circle(rng() * width, rng() * height, 1 + rng() * 5, color, .22));
}

function stoneTiles(width: number, height: number, cell: number) {
    const tiles: string[] = [];
    for (let x = 0; x < width; x += cell) {
        for (let y = 0; y < height; y += cell) {
            if (((x / cell) + (y / cell)) % 2 === 0) tiles.push(rect(x, y, cell, cell, 'rgba(0,0,0,.08)'));
        }
    }
    return tiles;
}

function grid(width: number, height: number, cell: number) {
    const lines: string[] = [];
    for (let x = 0; x <= width; x += cell) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(0,0,0,.28)" stroke-width="1"/>`);
    for (let y = 0; y <= height; y += cell) lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(0,0,0,.28)" stroke-width="1"/>`);
    return `<g>${lines.join('')}</g>`;
}

function baseColor(type: Exclude<ProceduralMapType, 'auto'>) {
    return {
        tavern: '#8b6914',
        forest: '#2d5016',
        dungeon: '#4a4a4a',
        desert: '#edc9af',
        cave: '#1a1a1a',
        castle: '#696969',
        town: '#5f6f46',
        road: '#32502d',
        'boss-arena': '#1f1f1f',
    }[type];
}

function rect(x: number, y: number, w: number, h: number, fill: string, opacity = 1) {
    return `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="${fill}" opacity="${opacity}"/>`;
}

function circle(x: number, y: number, r: number, fill: string, opacity = 1) {
    return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="${fill}" opacity="${opacity}"/>`;
}

function round(n: number) {
    return Math.round(n * 100) / 100;
}

function clampSize(size: number) {
    return Math.min(1536, Math.max(512, Math.round(size / 32) * 32));
}

function clampGrid(size: number) {
    return Math.min(96, Math.max(16, Math.round(size)));
}

function hashString(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededRandom(seed: number) {
    let state = seed || 1;
    return () => {
        state = Math.imul(1664525, state) + 1013904223;
        return ((state >>> 0) / 4294967296);
    };
}

function escapeXml(input: string) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
