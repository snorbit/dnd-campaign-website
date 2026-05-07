import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { POST } from './route';

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(),
}));

function makeRequest(body: unknown, token = 'jwt-token') {
    return new Request('http://localhost/api/join-campaign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    }) as any;
}

function chain<T extends Record<string, unknown>>(methods: T) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ...methods,
    };
}

describe('join campaign route', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        };
    });

    it('returns a clear error when admin env vars are missing', async () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;

        const response = await POST(makeRequest({ joinCode: 'ABC123' }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain('Supabase admin configuration');
    });

    it('rejects invalid join code formats', async () => {
        vi.mocked(createClient).mockReturnValue({} as any);

        const response = await POST(makeRequest({ joinCode: 'BAD' }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Invalid join code format');
    });

    it('joins an authenticated user to a campaign', async () => {
        const campaignBuilder = chain({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'campaign-1', dm_id: 'dm-1', name: 'Nightfall' },
                error: null,
            }),
        });
        const existingBuilder = chain({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        const insertBuilder = {
            insert: vi.fn().mockResolvedValue({ error: null }),
        };

        let campaignPlayersCalls = 0;
        const admin = {
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'player-1',
                            email: 'player@example.com',
                            user_metadata: { username: 'Player One' },
                        },
                    },
                    error: null,
                }),
            },
            from: vi.fn((table: string) => {
                if (table === 'campaigns') return campaignBuilder;
                if (table === 'campaign_players') {
                    campaignPlayersCalls += 1;
                    return campaignPlayersCalls === 1 ? existingBuilder : insertBuilder;
                }
                throw new Error(`Unexpected table: ${table}`);
            }),
        };

        vi.mocked(createClient).mockReturnValue(admin as any);

        const response = await POST(makeRequest({ joinCode: 'abc123' }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            campaignId: 'campaign-1',
            campaignName: 'Nightfall',
        });
        expect(insertBuilder.insert).toHaveBeenCalledWith({
            campaign_id: 'campaign-1',
            player_id: 'player-1',
            character_name: 'Player One',
        });
    });
});
