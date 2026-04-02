-- Supabase Schema for Polymarket Engine

-- Markets table (current state)
create table markets (
  condition_id text primary key,
  question text not null,
  slug text,
  sector text not null,
  yes_price float not null,
  no_price float not null,
  volume float not null default 0,
  liquidity float not null default 0,
  created_at timestamp with time zone,
  end_date timestamp with time zone,
  last_updated timestamp with time zone default now()
);

-- Price history (time series)
create table price_history (
  id bigint generated always as identity primary key,
  condition_id text not null references markets(condition_id) on delete cascade,
  yes_price float not null,
  volume float not null,
  timestamp timestamp with time zone default now()
);

-- Alerts table
create table alerts (
  id bigint generated always as identity primary key,
  condition_id text not null references markets(condition_id) on delete cascade,
  sector text not null,
  alert_type text not null,
  severity int not null check (severity >= 0 and severity <= 100),
  description text,
  timestamp timestamp with time zone default now()
);

-- Indexes for performance
create index idx_markets_sector on markets(sector);
create index idx_markets_volume on markets(volume desc);
create index idx_markets_end_date on markets(end_date);
create index idx_price_history_condition_id on price_history(condition_id);
create index idx_price_history_timestamp on price_history(timestamp desc);
create index idx_alerts_sector on alerts(sector);
create index idx_alerts_timestamp on alerts(timestamp desc);
create index idx_alerts_severity on alerts(severity desc);

-- Row Level Security (RLS) policies
create policy "Allow read access" on markets for select using (true);
create policy "Allow read access" on price_history for select using (true);
create policy "Allow read access" on alerts for select using (true);

-- Enable RLS
alter table markets enable row level security;
alter table price_history enable row level security;
alter table alerts enable row level security;

-- Optional: Auto-cleanup old price history (keep 30 days)
-- Run this as a cron job in Supabase or use pg_cron extension
-- delete from price_history where timestamp < now() - interval '30 days';
