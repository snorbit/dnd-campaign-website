import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for the join_code lookup
// The insert still validates properly since we use the user's actual ID
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { joinCode } = await req.json();

        if (!joinCode || joinCode.length !== 6) {
            return NextResponse.json({ error: 'Invalid join code format' }, { status: 400 });
        }

        // Get the calling user from their auth header
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Lookup the campaign by join code (service role bypasses RLS)
        const { data: campaign, error: findError } = await supabaseAdmin
            .from('campaigns')
            .select('id, dm_id, name')
            .eq('join_code', joinCode.toUpperCase().trim())
            .maybeSingle();

        if (findError || !campaign) {
            return NextResponse.json({ error: 'Invalid campaign code. Double-check and try again.' }, { status: 404 });
        }

        if (campaign.dm_id === user.id) {
            return NextResponse.json({ error: 'You are the DM of this campaign!' }, { status: 400 });
        }

        // Check if already a member
        const { data: existing } = await supabaseAdmin
            .from('campaign_players')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('player_id', user.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'You are already in this campaign!' }, { status: 400 });
        }

        // Join the campaign
        const characterName = user.user_metadata?.username || user.email?.split('@')[0] || 'Adventurer';
        const { error: joinErr } = await supabaseAdmin
            .from('campaign_players')
            .insert({
                campaign_id: campaign.id,
                player_id: user.id,
                character_name: characterName
            });

        if (joinErr) {
            return NextResponse.json({ error: 'Failed to join: ' + joinErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            campaignId: campaign.id,
            campaignName: campaign.name
        });

    } catch (error: any) {
        console.error('Join campaign error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
