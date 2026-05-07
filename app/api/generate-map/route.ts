import { NextRequest, NextResponse } from 'next/server';
import { generateBattleMap } from '@/lib/mapGenerationService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = await generateBattleMap(body);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Error generating map:', error);
        return NextResponse.json(
            { error: 'Failed to generate map: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
