import { NextRequest, NextResponse } from 'next/server';
import { generateProceduralMap, detectMapType } from '@/lib/mapGenerator';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        console.log('Generating procedural map:', prompt);

        // Detect map type from description
        const mapType = detectMapType(prompt);

        // Generate map programmatically
        const imageUrl = await generateProceduralMap({
            type: mapType,
            description: prompt
        });

        return NextResponse.json({
            success: true,
            imageUrl
        });

    } catch (error) {
        console.error('Error generating map:', error);
        return NextResponse.json(
            { error: 'Failed to generate map: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
