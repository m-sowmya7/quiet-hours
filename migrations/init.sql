-- Create pgexec function for running migrations
create or replace function public.pgexec(query text)
returns void
language plpgsql
as $$
begin
  execute query;
end;
$$;

-- Create a profiles table that extends the auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Create security policies
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create a trigger to create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create blocks table
create table public.blocks (
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

-- Create security policies for blocks
alter table public.blocks enable row level security;

create policy "Users can view their own blocks"
  on blocks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own blocks"
  on blocks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own blocks"
  on blocks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own blocks"
  on blocks for delete
  using (auth.uid() = user_id);