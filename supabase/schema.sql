-- Jun.fragrance V2 database foundation. Safe to run repeatedly.

create table if not exists public.jf_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int,
  is_active bool not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.jf_categories(id),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  inspired_by text,
  size_ml int not null default 50,
  price numeric not null,
  compare_at_price numeric,
  images text[] not null default '{}',
  notes_top text[] not null default '{}',
  notes_heart text[] not null default '{}',
  notes_base text[] not null default '{}',
  gender text check (gender in ('men', 'women', 'unisex')),
  accent_color text,
  is_featured bool not null default false,
  is_active bool not null default true,
  sort_order int,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  show_on_page text,
  faq jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_pages_seo (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_settings (
  key text primary key,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jf_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.jf_products(id),
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.jf_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jf_set_updated_at on public.jf_admins;
create trigger jf_set_updated_at before update on public.jf_admins for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_categories;
create trigger jf_set_updated_at before update on public.jf_categories for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_products;
create trigger jf_set_updated_at before update on public.jf_products for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_blog_posts;
create trigger jf_set_updated_at before update on public.jf_blog_posts for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_pages_seo;
create trigger jf_set_updated_at before update on public.jf_pages_seo for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_settings;
create trigger jf_set_updated_at before update on public.jf_settings for each row execute function public.jf_set_updated_at();
drop trigger if exists jf_set_updated_at on public.jf_reviews;
create trigger jf_set_updated_at before update on public.jf_reviews for each row execute function public.jf_set_updated_at();

create or replace function public.jf_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jf_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.jf_is_admin() from public;
grant execute on function public.jf_is_admin() to authenticated;

alter table public.jf_admins enable row level security;
alter table public.jf_categories enable row level security;
alter table public.jf_products enable row level security;
alter table public.jf_blog_posts enable row level security;
alter table public.jf_pages_seo enable row level security;
alter table public.jf_settings enable row level security;
alter table public.jf_reviews enable row level security;

-- Remove inherited/default table privileges before granting the exact client access below.
revoke all on table public.jf_admins, public.jf_categories, public.jf_products,
  public.jf_blog_posts, public.jf_pages_seo, public.jf_settings, public.jf_reviews
  from anon, authenticated;

grant select on table public.jf_admins to authenticated;
grant select on table public.jf_categories, public.jf_products, public.jf_blog_posts,
  public.jf_pages_seo, public.jf_settings, public.jf_reviews to anon, authenticated;
grant insert, update, delete on table public.jf_categories, public.jf_products,
  public.jf_blog_posts, public.jf_pages_seo, public.jf_settings, public.jf_reviews to authenticated;

drop policy if exists jf_admins_read_self on public.jf_admins;
create policy jf_admins_read_self on public.jf_admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists jf_categories_public_read on public.jf_categories;
create policy jf_categories_public_read on public.jf_categories for select to anon, authenticated
  using (is_active = true);
drop policy if exists jf_categories_admin_read on public.jf_categories;
create policy jf_categories_admin_read on public.jf_categories for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_categories_admin_insert on public.jf_categories;
create policy jf_categories_admin_insert on public.jf_categories for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_categories_admin_update on public.jf_categories;
create policy jf_categories_admin_update on public.jf_categories for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_categories_admin_delete on public.jf_categories;
create policy jf_categories_admin_delete on public.jf_categories for delete to authenticated
  using ((select public.jf_is_admin()));

drop policy if exists jf_products_public_read on public.jf_products;
create policy jf_products_public_read on public.jf_products for select to anon, authenticated
  using (is_active = true);
drop policy if exists jf_products_admin_read on public.jf_products;
create policy jf_products_admin_read on public.jf_products for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_products_admin_insert on public.jf_products;
create policy jf_products_admin_insert on public.jf_products for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_products_admin_update on public.jf_products;
create policy jf_products_admin_update on public.jf_products for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_products_admin_delete on public.jf_products;
create policy jf_products_admin_delete on public.jf_products for delete to authenticated
  using ((select public.jf_is_admin()));

drop policy if exists jf_blog_posts_public_read on public.jf_blog_posts;
create policy jf_blog_posts_public_read on public.jf_blog_posts for select to anon, authenticated
  using (status = 'published');
drop policy if exists jf_blog_posts_admin_read on public.jf_blog_posts;
create policy jf_blog_posts_admin_read on public.jf_blog_posts for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_blog_posts_admin_insert on public.jf_blog_posts;
create policy jf_blog_posts_admin_insert on public.jf_blog_posts for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_blog_posts_admin_update on public.jf_blog_posts;
create policy jf_blog_posts_admin_update on public.jf_blog_posts for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_blog_posts_admin_delete on public.jf_blog_posts;
create policy jf_blog_posts_admin_delete on public.jf_blog_posts for delete to authenticated
  using ((select public.jf_is_admin()));

drop policy if exists jf_pages_seo_public_read on public.jf_pages_seo;
create policy jf_pages_seo_public_read on public.jf_pages_seo for select to anon, authenticated
  using (true);
drop policy if exists jf_pages_seo_admin_read on public.jf_pages_seo;
create policy jf_pages_seo_admin_read on public.jf_pages_seo for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_pages_seo_admin_insert on public.jf_pages_seo;
create policy jf_pages_seo_admin_insert on public.jf_pages_seo for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_pages_seo_admin_update on public.jf_pages_seo;
create policy jf_pages_seo_admin_update on public.jf_pages_seo for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_pages_seo_admin_delete on public.jf_pages_seo;
create policy jf_pages_seo_admin_delete on public.jf_pages_seo for delete to authenticated
  using ((select public.jf_is_admin()));

drop policy if exists jf_settings_public_read on public.jf_settings;
create policy jf_settings_public_read on public.jf_settings for select to anon, authenticated
  using (true);
drop policy if exists jf_settings_admin_read on public.jf_settings;
create policy jf_settings_admin_read on public.jf_settings for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_settings_admin_insert on public.jf_settings;
create policy jf_settings_admin_insert on public.jf_settings for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_settings_admin_update on public.jf_settings;
create policy jf_settings_admin_update on public.jf_settings for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_settings_admin_delete on public.jf_settings;
create policy jf_settings_admin_delete on public.jf_settings for delete to authenticated
  using ((select public.jf_is_admin()));

drop policy if exists jf_reviews_public_read on public.jf_reviews;
create policy jf_reviews_public_read on public.jf_reviews for select to anon, authenticated
  using (is_approved = true);
drop policy if exists jf_reviews_admin_read on public.jf_reviews;
create policy jf_reviews_admin_read on public.jf_reviews for select to authenticated
  using ((select public.jf_is_admin()));
drop policy if exists jf_reviews_admin_insert on public.jf_reviews;
create policy jf_reviews_admin_insert on public.jf_reviews for insert to authenticated
  with check ((select public.jf_is_admin()));
drop policy if exists jf_reviews_admin_update on public.jf_reviews;
create policy jf_reviews_admin_update on public.jf_reviews for update to authenticated
  using ((select public.jf_is_admin())) with check ((select public.jf_is_admin()));
drop policy if exists jf_reviews_admin_delete on public.jf_reviews;
create policy jf_reviews_admin_delete on public.jf_reviews for delete to authenticated
  using ((select public.jf_is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jf-media',
  'jf-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select on table storage.objects to anon, authenticated;
grant insert, update, delete on table storage.objects to authenticated;
drop policy if exists jf_media_public_read on storage.objects;
create policy jf_media_public_read on storage.objects for select to public
  using (bucket_id = 'jf-media');
drop policy if exists jf_media_admin_insert on storage.objects;
create policy jf_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'jf-media' and (select public.jf_is_admin()));
drop policy if exists jf_media_admin_update on storage.objects;
create policy jf_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'jf-media' and (select public.jf_is_admin()))
  with check (bucket_id = 'jf-media' and (select public.jf_is_admin()));
drop policy if exists jf_media_admin_delete on storage.objects;
create policy jf_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'jf-media' and (select public.jf_is_admin()));

-- To grant administrator access to an existing Supabase Auth user:
-- insert into jf_admins (user_id) values ('<USER_UUID>');