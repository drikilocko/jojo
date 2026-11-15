create table if not exists public.vip_videos (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 120),
    description text not null default '',
    object_path text not null unique,
    cover_path text,
    visibility text not null default 'members'
        check (visibility in ('public', 'members')),
    created_at timestamptz not null default now()
);

alter table public.vip_videos
    add column if not exists cover_path text;

alter table public.vip_videos enable row level security;

drop policy if exists "Anyone can read public VIP videos" on public.vip_videos;
create policy "Anyone can read public VIP videos"
    on public.vip_videos for select to anon, authenticated
    using (visibility = 'public');

drop policy if exists "Admins manage VIP videos" on public.vip_videos;
create policy "Admins manage VIP videos"
    on public.vip_videos for all to authenticated
    using (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ))
    with check (exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    ));

grant select on public.vip_videos to anon, authenticated;
grant insert, update, delete on public.vip_videos to authenticated;
grant execute on function public.redeem_vip_access_code(text, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'vip-videos',
    'vip-videos',
    false,
    104857600,
    array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins manage VIP video files" on storage.objects;
create policy "Admins manage VIP video files"
    on storage.objects for all to authenticated
    using (
        bucket_id = 'vip-videos'
        and exists (
            select 1 from public.profiles
            where profiles.id = (select auth.uid()) and profiles.role = 'admin'
        )
    )
    with check (
        bucket_id = 'vip-videos'
        and exists (
            select 1 from public.profiles
            where profiles.id = (select auth.uid()) and profiles.role = 'admin'
        )
    );

do $$
declare
    admin_user_id uuid;
begin
    select id into admin_user_id
    from auth.users
    where lower(email) = lower('jojo@gmail.com')
    limit 1;

    if admin_user_id is null then
        raise exception 'Create jojo@gmail.com in Supabase Auth before running this script.';
    end if;

    insert into public.profiles (id, full_name, role)
    values (admin_user_id, 'Jojo', 'admin')
    on conflict (id) do update set role = 'admin';
end;
$$;
