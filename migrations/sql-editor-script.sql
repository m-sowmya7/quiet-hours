-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO CREATE REQUIRED TABLES

-- Create a profiles table that extends the auth.users table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create security policies if they don't exist
do $$
begin
  if not exists (
    select from pg_policies where tablename = 'profiles' and policyname = 'Users can view their own profile'
  ) then
    create policy "Users can view their own profile"
      on profiles for select
      using (auth.uid() = id);
  end if;
  
  if not exists (
    select from pg_policies where tablename = 'profiles' and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
      on profiles for update
      using (auth.uid() = id);
  end if;
end;
$$ language plpgsql;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create profile creation trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger if it doesn't exist
do $$
begin
  if not exists (
    select from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end;
$$ language plpgsql;

-- Create blocks table
create table if not exists public.blocks (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  user_email text,
  title text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  notified boolean default false,
  notified_at timestamp with time zone,
  email_sent boolean default false,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create security policies for blocks if they don't exist
do $$
begin
  -- Enable RLS on blocks
  alter table public.blocks enable row level security;
  
  if not exists (
    select from pg_policies where tablename = 'blocks' and policyname = 'Users can view their own blocks'
  ) then
    create policy "Users can view their own blocks"
      on blocks for select
      using (auth.uid() = user_id);
  end if;
  
  if not exists (
    select from pg_policies where tablename = 'blocks' and policyname = 'Users can insert their own blocks'
  ) then
    create policy "Users can insert their own blocks"
      on blocks for insert
      with check (auth.uid() = user_id);
  end if;
  
  if not exists (
    select from pg_policies where tablename = 'blocks' and policyname = 'Users can update their own blocks'
  ) then
    create policy "Users can update their own blocks"
      on blocks for update
      using (auth.uid() = user_id);
  end if;
  
  if not exists (
    select from pg_policies where tablename = 'blocks' and policyname = 'Users can delete their own blocks'
  ) then
    create policy "Users can delete their own blocks"
      on blocks for delete
      using (auth.uid() = user_id);
  end if;
end;
$$ language plpgsql;