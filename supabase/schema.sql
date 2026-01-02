-- Create a table to hold the entire campaign state
-- We will use a single row with ID=1 for simplicity, storing JSON blobs.
-- Alternatively, we could have relational tables (players, encounters, etc.), 
-- but JSONB is faster for this specific "sync everything" React Context architecture.

create table campaign (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default now(),
  players jsonb default '[]'::jsonb,
  world jsonb default '{"day": 1, "time": "08:00 AM", "session": 1}'::jsonb,
  map jsonb default '{"url": ""}'::jsonb,
  encounters jsonb default '[]'::jsonb,
  quests jsonb default '[]'::jsonb
);

-- Insert the initial row
insert into campaign (players, world, map, encounters, quests)
values (
  '[]'::jsonb, 
  '{"day": 1, "time": "08:00 AM", "session": 1}'::jsonb, 
  '{"url": ""}'::jsonb, 
  '[]'::jsonb, 
  '[]'::jsonb
);

-- Enable Realtime
alter publication supabase_realtime add table campaign;
