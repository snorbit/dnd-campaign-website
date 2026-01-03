-- Create a table to hold the entire campaign state (Safety check included)
create table if not exists campaign (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default now(),
  players jsonb default '[]'::jsonb,
  world jsonb default '{"day": 1, "time": "08:00 AM", "session": 1}'::jsonb,
  map jsonb default '{"url": ""}'::jsonb,
  encounters jsonb default '[]'::jsonb,
  quests jsonb default '[]'::jsonb
);

-- Insert the initial row safely (only if table is empty)
do $$
begin
  if not exists (select 1 from campaign) then
    insert into campaign (players, world, map, encounters, quests)
    values (
      '[]'::jsonb, 
      '{"day": 1, "time": "08:00 AM", "session": 1}'::jsonb, 
      '{"url": ""}'::jsonb, 
      '[]'::jsonb, 
      '[]'::jsonb
    );
  end if;
end $$;

-- Enable Realtime safely
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'campaign') then
    alter publication supabase_realtime add table campaign;
  end if;
end $$;

-- DISABLE RLS DO NOT FORGET
alter table campaign disable row level security;
