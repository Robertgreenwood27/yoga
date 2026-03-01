-- Run this in your Supabase SQL editor

create table modules (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  color text default '#6366f1',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table flashcards (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  front_text text,
  front_image_url text,
  back_text text,
  back_image_url text,
  position integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS (optional - remove if you want open access during dev)
alter table modules enable row level security;
alter table flashcards enable row level security;

-- Allow all access for now (tighten later with auth)
create policy "Allow all on modules" on modules for all using (true) with check (true);
create policy "Allow all on flashcards" on flashcards for all using (true) with check (true);

-- Storage bucket for card images
insert into storage.buckets (id, name, public) values ('card-images', 'card-images', true);
create policy "Allow all on card-images" on storage.objects for all using (bucket_id = 'card-images') with check (bucket_id = 'card-images');


-- Add parent_id to support nested modules
ALTER TABLE modules ADD COLUMN parent_id uuid references modules(id) on delete cascade;

-- Index for performance when fetching children
CREATE INDEX idx_modules_parent_id ON modules(parent_id);
