create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null default '',
    avatar_url text,
    saved_address jsonb,
    role text not null default 'customer' check (role in ('customer', 'admin')),
    created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists saved_address jsonb;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

create table if not exists public.products (
    id text primary key,
    data jsonb not null,
    created_at timestamptz not null default now()
);

create table if not exists public.orders (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    date text not null,
    items jsonb not null,
    subtotal numeric not null,
    discount numeric not null default 0,
    shipping numeric not null default 0,
    total numeric not null,
    currency text not null check (currency in ('USD', 'EUR', 'GBP', 'FCFA')),
    shipping_address jsonb not null,
    payment_method text not null check (payment_method in ('card', 'apple-pay', 'paypal', 'cod', 'tmoney', 'flooz')),
    status text not null default 'placed' check (status in ('placed', 'processing', 'shipped', 'delivered')),
    estimated_delivery text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id text not null references public.products(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, product_id)
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist_items enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
    on public.profiles for select to authenticated
    using (id = (select auth.uid()));

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
    on public.products for select to anon, authenticated
    using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
    on public.products for all to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ))
    with check (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ));

drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders"
    on public.orders for select to authenticated
    using (user_id = (select auth.uid()) or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ));

drop policy if exists "Customers create their own orders" on public.orders;
create policy "Customers create their own orders"
    on public.orders for insert to authenticated
    with check (user_id = (select auth.uid()));

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
    on public.orders for update to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ))
    with check (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ));

drop policy if exists "Customers manage their own wishlist" on public.wishlist_items;
create policy "Customers manage their own wishlist"
    on public.wishlist_items for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;

create or replace function public.save_shipping_address(address jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.profiles
    set saved_address = address
    where id = (select auth.uid());
    if not found then
        raise exception 'Profile not found for the current user';
    end if;
end;
$$;

revoke all on function public.save_shipping_address(jsonb) from public, anon;
grant execute on function public.save_shipping_address(jsonb) to authenticated;
