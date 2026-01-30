// Procedural D&D Battle Map Generator
// Generates maps using code, no AI required

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const GRID_SIZE = 32; // pixels per grid square
const MAP_SIZE = 32; // 32x32 grid
const CANVAS_SIZE = GRID_SIZE * MAP_SIZE; // 1024x1024

type MapType = 'tavern' | 'forest' | 'dungeon' | 'desert' | 'cave' | 'castle';

interface MapConfig {
    type: MapType;
    description: string;
}

export async function generateProceduralMap(config: MapConfig): Promise<string> {
    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');

    // Draw based on map type
    switch (config.type) {
        case 'tavern':
            drawTavernInterior(ctx);
            break;
        case 'forest':
            drawForestPath(ctx);
            break;
        case 'dungeon':
            drawDungeonRoom(ctx);
            break;
        case 'desert':
            drawDesertArea(ctx);
            break;
        case 'cave':
            drawCaveSystem(ctx);
            break;
        case 'castle':
            drawCastleRoom(ctx);
            break;
        default:
            drawGenericRoom(ctx);
    }

    // Draw grid overlay
    drawGrid(ctx);

    // Save to file
    const filename = `map_${config.type}_${Date.now()}.png`;
    const filepath = path.join(process.cwd(), 'public', 'maps', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);

    return `/maps/${filename}`;
}

function drawTavernInterior(ctx: any) {
    // Background - wooden floor
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Add floor texture
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(139, 105, 20, ${Math.random() * 0.3})`;
        ctx.fillRect(
            Math.random() * CANVAS_SIZE,
            Math.random() * CANVAS_SIZE,
            Math.random() * 100 + 50,
            5
        );
    }

    // Walls
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, 0, CANVAS_SIZE, GRID_SIZE * 2); // Top wall
    ctx.fillRect(0, 0, GRID_SIZE * 2, CANVAS_SIZE); // Left wall
    ctx.fillRect(CANVAS_SIZE - GRID_SIZE * 2, 0, GRID_SIZE * 2, CANVAS_SIZE); // Right wall
    ctx.fillRect(0, CANVAS_SIZE - GRID_SIZE * 2, CANVAS_SIZE, GRID_SIZE * 2); // Bottom wall

    // Fireplace
    ctx.fillStyle = '#333';
    ctx.fillRect(GRID_SIZE * 14, GRID_SIZE * 2, GRID_SIZE * 4, GRID_SIZE * 3);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(GRID_SIZE * 15, GRID_SIZE * 3, GRID_SIZE * 2, GRID_SIZE);

    // Tables (brown rectangles)
    const tables = [
        { x: 6, y: 8, w: 4, h: 2 },
        { x: 20, y: 8, w: 4, h: 2 },
        { x: 6, y: 20, w: 4, h: 2 },
        { x: 20, y: 20, w: 4, h: 2 },
    ];

    ctx.fillStyle = '#5C4033';
    tables.forEach(table => {
        ctx.fillRect(
            table.x * GRID_SIZE,
            table.y * GRID_SIZE,
            table.w * GRID_SIZE,
            table.h * GRID_SIZE
        );
    });

    // Bar counter
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(GRID_SIZE * 24, GRID_SIZE * 14, GRID_SIZE * 6, GRID_SIZE * 10);

    // Chairs (small squares around tables)
    ctx.fillStyle = '#704214';
    tables.forEach(table => {
        // Above
        ctx.fillRect((table.x + 1) * GRID_SIZE, (table.y - 1) * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        // Below
        ctx.fillRect((table.x + 1) * GRID_SIZE, (table.y + table.h) * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        // Left
        ctx.fillRect((table.x - 1) * GRID_SIZE, (table.y + 0.5) * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        // Right
        ctx.fillRect((table.x + table.w) * GRID_SIZE, (table.y + 0.5) * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
}

function drawForestPath(ctx: any) {
    // Background - grass
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dirt path (winding)
    ctx.fillStyle = '#8B7355';
    for (let y = 0; y < MAP_SIZE; y++) {
        const offset = Math.sin(y / 3) * 5;
        const x = MAP_SIZE / 2 + offset;
        ctx.fillRect(
            (x - 3) * GRID_SIZE,
            y * GRID_SIZE,
            6 * GRID_SIZE,
            GRID_SIZE
        );
    }

    // Trees (dark green circles with brown trunks)
    const treePositions = [];
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * MAP_SIZE;
        const y = Math.random() * MAP_SIZE;

        // Don't place trees on the path
        const pathCenter = MAP_SIZE / 2 + Math.sin(y / 3) * 5;
        if (Math.abs(x - pathCenter) > 4) {
            treePositions.push({ x, y });
        }
    }

    treePositions.forEach(pos => {
        // Trunk
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(
            pos.x * GRID_SIZE,
            pos.y * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE * 2
        );

        // Leaves
        ctx.fillStyle = '#1a4d2e';
        ctx.beginPath();
        ctx.arc(
            (pos.x + 0.5) * GRID_SIZE,
            pos.y * GRID_SIZE,
            GRID_SIZE * 1.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Rocks along path
    ctx.fillStyle = '#666';
    for (let i = 0; i < 15; i++) {
        const y = Math.random() * MAP_SIZE;
        const pathCenter = MAP_SIZE / 2 + Math.sin(y / 3) * 5;
        const x = pathCenter + (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2);

        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
}

function drawDungeonRoom(ctx: any) {
    // Stone floor
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Floor tiles texture
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // Stone walls
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, CANVAS_SIZE, GRID_SIZE * 3); // Top
    ctx.fillRect(0, 0, GRID_SIZE * 3, CANVAS_SIZE); // Left
    ctx.fillRect(CANVAS_SIZE - GRID_SIZE * 3, 0, GRID_SIZE * 3, CANVAS_SIZE); // Right
    ctx.fillRect(0, CANVAS_SIZE - GRID_SIZE * 3, CANVAS_SIZE, GRID_SIZE * 3); // Bottom

    // Pillars
    ctx.fillStyle = '#555';
    const pillarPositions = [
        { x: 8, y: 8 },
        { x: 23, y: 8 },
        { x: 8, y: 23 },
        { x: 23, y: 23 },
    ];

    pillarPositions.forEach(pos => {
        ctx.fillRect(pos.x * GRID_SIZE, pos.y * GRID_SIZE, GRID_SIZE * 2, GRID_SIZE * 2);
    });

    // Treasure chest
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(GRID_SIZE * 15, GRID_SIZE * 28, GRID_SIZE * 2, GRID_SIZE * 1.5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(GRID_SIZE * 15.3, GRID_SIZE * 28.3, GRID_SIZE * 1.4, GRID_SIZE);
}

function drawDesertArea(ctx: any) {
    // Sand background
    ctx.fillStyle = '#EDC9AF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Sand dunes (wavy patterns)
    ctx.fillStyle = '#DEB887';
    for (let y = 0; y < MAP_SIZE; y += 4) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const wave = Math.sin((x + y) / 2) * 2;
            ctx.fillRect(x * GRID_SIZE, (y + wave) * GRID_SIZE, GRID_SIZE, GRID_SIZE * 2);
        }
    }

    // Rocks
    ctx.fillStyle = '#8B7355';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(
            Math.random() * CANVAS_SIZE,
            Math.random() * CANVAS_SIZE,
            GRID_SIZE * (1 + Math.random()),
            GRID_SIZE * (1 + Math.random())
        );
    }

    // Ancient ruins (stone blocks)
    ctx.fillStyle = '#696969';
    ctx.fillRect(GRID_SIZE * 10, GRID_SIZE * 10, GRID_SIZE * 12, GRID_SIZE * 1);
    ctx.fillRect(GRID_SIZE * 10, GRID_SIZE * 10, GRID_SIZE * 1, GRID_SIZE * 8);
    ctx.fillRect(GRID_SIZE * 21, GRID_SIZE * 10, GRID_SIZE * 1, GRID_SIZE * 8);
}

function drawCaveSystem(ctx: any) {
    // Dark cave walls
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Create organic cave floor
    ctx.fillStyle = '#3a3a3a';
    const centerX = MAP_SIZE / 2;
    const centerY = MAP_SIZE / 2;

    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const noise = Math.random() * 5;
            if (dist + noise < 14) {
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // Crystals (cyan/blue)
    ctx.fillStyle = '#00CED1';
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * 10;
        const y = centerY + Math.sin(angle) * 10;

        ctx.beginPath();
        ctx.moveTo(x * GRID_SIZE, y * GRID_SIZE);
        ctx.lineTo((x + 1) * GRID_SIZE, (y - 1) * GRID_SIZE);
        ctx.lineTo((x + 0.5) * GRID_SIZE, (y - 2) * GRID_SIZE);
        ctx.closePath();
        ctx.fill();
    }

    // Underground lake (center)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(centerX * GRID_SIZE, centerY * GRID_SIZE, GRID_SIZE * 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawCastleRoom(ctx: any) {
    // Stone floor
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Checkerboard pattern
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = '#808080';
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // Thick stone walls
    ctx.fillStyle = '#4F4F4F';
    ctx.fillRect(0, 0, CANVAS_SIZE, GRID_SIZE * 4); // Top
    ctx.fillRect(0, 0, GRID_SIZE * 4, CANVAS_SIZE); // Left
    ctx.fillRect(CANVAS_SIZE - GRID_SIZE * 4, 0, GRID_SIZE * 4, CANVAS_SIZE); // Right
    ctx.fillRect(0, CANVAS_SIZE - GRID_SIZE * 4, CANVAS_SIZE, GRID_SIZE * 4); // Bottom

    // Throne
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(GRID_SIZE * 14, GRID_SIZE * 4, GRID_SIZE * 4, GRID_SIZE * 4);

    // Red carpet
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(GRID_SIZE * 14, GRID_SIZE * 8, GRID_SIZE * 4, GRID_SIZE * 20);

    // Banners on walls
    ctx.fillStyle = '#00008B';
    ctx.fillRect(GRID_SIZE * 6, GRID_SIZE * 2, GRID_SIZE, GRID_SIZE * 3);
    ctx.fillRect(GRID_SIZE * 25, GRID_SIZE * 2, GRID_SIZE, GRID_SIZE * 3);
}

function drawGenericRoom(ctx: any) {
    // Gray room
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Walls
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, CANVAS_SIZE, GRID_SIZE * 2);
    ctx.fillRect(0, 0, GRID_SIZE * 2, CANVAS_SIZE);
    ctx.fillRect(CANVAS_SIZE - GRID_SIZE * 2, 0, GRID_SIZE * 2, CANVAS_SIZE);
    ctx.fillRect(0, CANVAS_SIZE - GRID_SIZE * 2, CANVAS_SIZE, GRID_SIZE * 2);
}

function drawGrid(ctx: any) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= MAP_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * GRID_SIZE, 0);
        ctx.lineTo(x * GRID_SIZE, CANVAS_SIZE);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= MAP_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * GRID_SIZE);
        ctx.lineTo(CANVAS_SIZE, y * GRID_SIZE);
        ctx.stroke();
    }
}

export function detectMapType(description: string): MapType {
    const lower = description.toLowerCase();

    if (lower.includes('tavern') || lower.includes('inn') || lower.includes('bar')) return 'tavern';
    if (lower.includes('forest') || lower.includes('wood') || lower.includes('tree')) return 'forest';
    if (lower.includes('dungeon') || lower.includes('prison') || lower.includes('cell')) return 'dungeon';
    if (lower.includes('desert') || lower.includes('sand') || lower.includes('dune')) return 'desert';
    if (lower.includes('cave') || lower.includes('cavern') || lower.includes('underground')) return 'cave';
    if (lower.includes('castle') || lower.includes('palace') || lower.includes('throne')) return 'castle';

    return 'dungeon'; // default
}
