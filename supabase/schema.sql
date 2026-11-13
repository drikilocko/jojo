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

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.vip_access_codes (
    code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
    code_value text,
    payment_order_id text unique,
    expires_at timestamptz,
    validity interval not null default interval '30 days',
    redeemed_installation_id text,
    redeemed_at timestamptz,
    created_at timestamptz not null default now(),
    check ((payment_order_id is null) = (code_value is null))
);

alter table public.vip_access_codes enable row level security;
revoke all on table public.vip_access_codes from public, anon, authenticated;
grant select, insert, update on table public.vip_access_codes to service_role;

create or replace function public.redeem_vip_access_code(
    p_code text,
    p_installation_id text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
    access_expiry timestamptz;
begin
    if p_code is null
        or pg_catalog.length(pg_catalog.btrim(p_code)) < 6
        or pg_catalog.length(pg_catalog.btrim(p_code)) > 80
        or p_installation_id is null
        or length(p_installation_id) < 20
        or length(p_installation_id) > 100 then
        return null;
    end if;

    update public.vip_access_codes
    set redeemed_installation_id = coalesce(redeemed_installation_id, p_installation_id),
        redeemed_at = coalesce(redeemed_at, pg_catalog.now()),
        expires_at = coalesce(expires_at, pg_catalog.now() + validity)
    where code_hash = pg_catalog.encode(
            extensions.digest(pg_catalog.lower(pg_catalog.btrim(p_code)), 'sha256'),
            'hex'
        )
        and (
            redeemed_installation_id is null
            or (
                redeemed_installation_id = p_installation_id
                and expires_at > pg_catalog.now()
            )
        )
    returning expires_at into access_expiry;

    return access_expiry;
end;
$$;

revoke all on function public.redeem_vip_access_code(text, text) from public;
grant execute on function public.redeem_vip_access_code(text, text) to anon, authenticated;

create or replace function public.issue_vip_access_code(p_order_id text)
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
    generated_code text;
    generated_token text;
    generated_expiry timestamptz;
begin
    if p_order_id is null or p_order_id !~ '^PASS-[0-9]+$' then
        raise exception 'Invalid subscription order id';
    end if;

    select vip_access_codes.code_value, vip_access_codes.expires_at
    into generated_code, generated_expiry
    from public.vip_access_codes
    where vip_access_codes.payment_order_id = p_order_id;

    if found then
        return query select generated_code, generated_expiry;
        return;
    end if;

    loop
        generated_token := pg_catalog.translate(
            pg_catalog.encode(extensions.gen_random_bytes(9), 'base64'),
            '+/',
            '-_'
        );
        generated_code := pg_catalog.substr(generated_token, 1, 6)
            || '-' || pg_catalog.substr(generated_token, 7, 6);
        generated_expiry := pg_catalog.now() + interval '30 days';

        begin
            insert into public.vip_access_codes (
                code_hash,
                code_value,
                payment_order_id,
                expires_at
            )
            values (
                pg_catalog.encode(
                    extensions.digest(pg_catalog.lower(generated_code), 'sha256'),
                    'hex'
                ),
                generated_code,
                p_order_id,
                generated_expiry
            );

            return query select generated_code, generated_expiry;
            return;
        exception when unique_violation then
            select vip_access_codes.code_value, vip_access_codes.expires_at
            into generated_code, generated_expiry
            from public.vip_access_codes
            where vip_access_codes.payment_order_id = p_order_id;

            if found then
                return query select generated_code, generated_expiry;
                return;
            end if;
        end;
    end loop;
end;
$$;

revoke all on function public.issue_vip_access_code(text) from public, anon, authenticated;
grant execute on function public.issue_vip_access_code(text) to service_role;
