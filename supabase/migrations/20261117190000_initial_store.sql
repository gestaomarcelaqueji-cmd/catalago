-- Loja independente · Banco sem checkout, pagamentos, frete ou contas de clientes.
create extension if not exists pgcrypto;
create schema if not exists private;
create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Administrador',
  role text not null default 'operator' check(role in ('owner','operator')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.admin_profiles where id=(select auth.uid()) and active=true)
$$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create table public.store_settings (
  id smallint primary key default 1 check (id=1),
  name text not null default 'Nova Loja',
  tagline text not null default 'Sua nova seleção',
  announcement text not null default '',
  whatsapp text not null default '',
  logo_url text not null default '',
  contact_email text not null default '',
  instagram_url text not null default '',
  about_text text not null default '',
  privacy_text text not null default '',
  accent_color text not null default '#161616',
  updated_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 120),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 parent_id uuid references public.categories(id) on delete set null,
 description text not null default '',
 sort_order int not null default 0,
 visible boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 200),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text not null default '',
 status text not null default 'draft' check (status in ('draft','published','archived')),
 featured boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.product_categories (
 product_id uuid not null references public.products(id) on delete cascade,
 category_id uuid not null references public.categories(id) on delete cascade,
 primary key(product_id,category_id)
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 name text not null default 'Único',
 sku text unique,
 attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes)='object'),
 price_cents int not null check(price_cents>=0),
 compare_price_cents int check(compare_price_cents is null or compare_price_cents>=0),
 stock int not null default 0 check(stock>=0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 url text not null,
 alt text not null default '',
 sort_order int not null default 0,
 created_at timestamptz not null default now()
);
create table public.home_sections (
 id uuid primary key default gen_random_uuid(),
 section_key text unique not null,
 type text not null check(type in ('slideshow','brand-strip','category-tiles','product-carousel','banner-grid','full-banner','info-row')),
 title text not null default '',
 enabled boolean not null default true,
 sort_order int not null default 0,
 config jsonb not null default '{}'::jsonb check(jsonb_typeof(config)='object'),
 updated_at timestamptz not null default now()
);
create table public.quote_requests (
 id uuid primary key default gen_random_uuid(),
 code text unique not null default upper(substring(replace(gen_random_uuid()::text,'-',''),1,10)),
 status text not null default 'initiated' check(status in ('initiated','attending','confirmed','completed','cancelled')),
 idempotency_key uuid not null unique,
 total_cents int not null default 0 check(total_cents>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 confirmed_at timestamptz,
 stock_reversed_at timestamptz
);
create table public.quote_items (
 id uuid primary key default gen_random_uuid(),
 quote_id uuid not null references public.quote_requests(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete set null,
 product_name text not null,
 variant_name text not null,
 unit_price_cents int not null check(unit_price_cents>=0),
 quantity int not null check(quantity between 1 and 99)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null references public.product_variants(id) on delete cascade,
 delta int not null check(delta<>0),
 reason text not null,
 quote_id uuid references public.quote_requests(id),
 actor_id uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index products_status_idx on public.products(status);
create index variants_product_idx on public.product_variants(product_id);
create index images_product_idx on public.product_images(product_id,sort_order);
create index products_categories_idx on public.product_categories(category_id);
create index quote_created_idx on public.quote_requests(created_at desc);

-- Every public table uses RLS. Only published store data is visible to buyers.
do $$ declare tab text; begin
  foreach tab in array array['admin_profiles','store_settings','categories','products','product_categories','product_variants','product_images','home_sections','quote_requests','quote_items','inventory_movements'] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format('create policy admin_all on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',tab);
  end loop;
end $$;
create policy public_store on public.store_settings for select to anon,authenticated using(true);
create policy public_categories on public.categories for select to anon,authenticated using(visible=true);
create policy public_products on public.products for select to anon,authenticated using(status='published');
create policy public_product_categories on public.product_categories for select to anon,authenticated using(
 exists(select 1 from public.products p where p.id=product_id and p.status='published')
);
create policy public_variants on public.product_variants for select to anon,authenticated using(active and exists(
 select 1 from public.products p where p.id=product_id and p.status='published'));
create policy public_images on public.product_images for select to anon,authenticated using(exists(
 select 1 from public.products p where p.id=product_id and p.status='published'));
create policy public_home on public.home_sections for select to anon,authenticated using(enabled=true);

-- Harden default PUBLIC / anon privileges before explicitly granting public catalogue reads.
revoke all on all tables in schema public from public, anon;
-- Explicit Data API grants; RLS still determines rows.
grant select on public.store_settings, public.categories, public.products, public.product_categories,
 public.product_variants, public.product_images, public.home_sections to anon;
grant select on public.store_settings, public.categories, public.products, public.product_categories,
 public.product_variants, public.product_images, public.home_sections to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
-- QUOTES intentionally have NO anon access and require server-held secret for writes.

-- Public images with admin-only upload/write; images aren't the identity of the previous store.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('store-media','store-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do nothing;
create policy store_media_public_read on storage.objects for select to anon,authenticated
  using(bucket_id='store-media');
create policy store_media_admin_insert on storage.objects for insert to authenticated
  with check(bucket_id='store-media' and (select private.is_admin()));
create policy store_media_admin_update on storage.objects for update to authenticated
  using(bucket_id='store-media' and (select private.is_admin()))
  with check(bucket_id='store-media' and (select private.is_admin()));
create policy store_media_admin_delete on storage.objects for delete to authenticated
  using(bucket_id='store-media' and (select private.is_admin()));

insert into public.store_settings(id,name,tagline) values (1,'Nova Loja','Seu estilo, suas escolhas');
-- Initial sections preserve the layout order from the supplied home.json, with NO old images, labels or links.
insert into public.home_sections(section_key,type,title,enabled,sort_order,config) values
 ('hero','slideshow','Destaques',true,10,'{"slides":[]}'::jsonb),
 ('info','info-row','Benefícios',false,20,'{"items":[]}'::jsonb),
 ('brands','brand-strip','Marcas',false,30,'{"items":[]}'::jsonb),
 ('categories','category-tiles','Explore',true,40,'{"tiles":[]}'::jsonb),
 ('featured1','product-carousel','Novidades',true,50,'{"limit":8}'::jsonb),
 ('banners2','banner-grid','Coleções',false,60,'{"banners":[]}'::jsonb),
 ('featured2','product-carousel','Em destaque',true,70,'{"limit":8}'::jsonb),
 ('banners3','banner-grid','Inspirar',false,80,'{"banners":[]}'::jsonb),
 ('featured3','product-carousel','Selecionados',false,90,'{"limit":8}'::jsonb),
 ('bottom','full-banner','Sua próxima descoberta',false,100,'{}'::jsonb);

alter table public.quote_requests add column requester_hash text;
create index quote_rate_idx on public.quote_requests(requester_hash,created_at desc);
-- Server-only endpoint: executable ONLY by service_role, never by storefront clients.
create or replace function public.create_quote_internal(p_items jsonb,p_idempotency_key uuid,p_requester_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_quote public.quote_requests%rowtype; v_item jsonb; v_variant record;
  v_quantity int; v_total int := 0; v_lines jsonb := '[]'::jsonb;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20
 then raise exception 'invalid items'; end if;
 -- Serialize requests by IP hash to make rate limiting deterministic.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_requester_hash));
 select * into v_quote from public.quote_requests where idempotency_key=p_idempotency_key;
 if found then
  select coalesce(jsonb_agg(jsonb_build_object('name',product_name,'variant',variant_name,'quantity',quantity,'price_cents',unit_price_cents)),'[]'::jsonb)
  into v_lines from public.quote_items where quote_id=v_quote.id;
  return jsonb_build_object('code',v_quote.code,'total_cents',v_quote.total_cents,'lines',v_lines);
 end if;
 if (select count(*) from public.quote_requests where requester_hash=p_requester_hash and created_at>now()-interval '10 minutes') >= 8 then
  raise exception 'rate_limit';
 end if;
 insert into public.quote_requests(idempotency_key,requester_hash) values (p_idempotency_key,p_requester_hash) returning * into v_quote;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if (v_item->>'variantId') is null or (v_item->>'quantity') is null
  then raise exception 'invalid items'; end if;
  v_quantity=(v_item->>'quantity')::integer;
  if v_quantity < 1 or v_quantity > 20 then raise exception 'invalid quantity'; end if;
  select pv.id,pv.name,pv.price_cents,pv.stock,p.name as product_name into v_variant
  from public.product_variants pv join public.products p on p.id=pv.product_id
  where pv.id=(v_item->>'variantId')::uuid and pv.active and p.status='published'
  for share of pv;
  if not found then raise exception 'invalid variant'; end if;
  if v_variant.stock < v_quantity then raise exception 'stock unavailable'; end if;
  insert into public.quote_items(quote_id,variant_id,product_name,variant_name,unit_price_cents,quantity)
  values(v_quote.id,v_variant.id,v_variant.product_name,v_variant.name,v_variant.price_cents,v_quantity);
  v_total=v_total+v_variant.price_cents*v_quantity;
  v_lines=v_lines||jsonb_build_array(jsonb_build_object('name',v_variant.product_name,'variant',v_variant.name,'quantity',v_quantity,'price_cents',v_variant.price_cents));
 end loop;
 update public.quote_requests set total_cents=v_total where id=v_quote.id;
 return jsonb_build_object('code',v_quote.code,'total_cents',v_total,'lines',v_lines);
end $$;
revoke all on function public.create_quote_internal(jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.create_quote_internal(jsonb,uuid,text) to service_role;

create or replace function public.adjust_stock(p_variant_id uuid,p_delta int,p_reason text)
returns int language plpgsql security invoker set search_path='' as $$
declare v_stock int;
begin
 if not (select private.is_admin()) then raise exception 'access denied'; end if;
 if p_delta=0 or abs(p_delta)>100000 or length(trim(p_reason)) not between 3 and 500 then raise exception 'invalid adjustment'; end if;
 update public.product_variants set stock=stock+p_delta where id=p_variant_id and stock+p_delta>=0 returning stock into v_stock;
 if not found then raise exception 'insufficient stock or variant missing'; end if;
 insert into public.inventory_movements(variant_id,delta,reason,actor_id) values(p_variant_id,p_delta,p_reason,(select auth.uid()));
 return v_stock;
end $$;
revoke all on function public.adjust_stock(uuid,int,text) from public,anon;
grant execute on function public.adjust_stock(uuid,int,text) to authenticated;

create or replace function public.change_quote_status(p_quote_id uuid,p_status text,p_reverse_stock boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare q public.quote_requests%rowtype; item record; updated_stock int;
begin
 if not (select private.is_admin()) then raise exception 'access denied'; end if;
 if p_status not in ('attending','confirmed','completed','cancelled') then raise exception 'invalid status'; end if;
 select * into q from public.quote_requests where id=p_quote_id for update;
 if not found then raise exception 'not found'; end if;
 if q.status=p_status then return; end if;
 if not ((q.status='initiated' and p_status in ('attending','confirmed','cancelled'))
   or (q.status='attending' and p_status in ('confirmed','cancelled'))
   or (q.status='confirmed' and p_status in ('completed','cancelled'))
   or (q.status='completed' and p_status='cancelled')) then raise exception 'invalid transition'; end if;
 if p_status='confirmed' and q.confirmed_at is null then
  for item in select variant_id,quantity from public.quote_items where quote_id=q.id order by variant_id loop
   if item.variant_id is null then raise exception 'missing variant'; end if;
   update public.product_variants set stock=stock-item.quantity
   where id=item.variant_id and stock>=item.quantity returning stock into updated_stock;
   if not found then raise exception 'insufficient stock'; end if;
   insert into public.inventory_movements(variant_id,delta,reason,quote_id,actor_id)
   values(item.variant_id,-item.quantity,'Venda confirmada manualmente',q.id,(select auth.uid()));
  end loop;
  update public.quote_requests set confirmed_at=now() where id=q.id;
 end if;
 if p_status='cancelled' and p_reverse_stock and q.confirmed_at is not null and q.stock_reversed_at is null then
  for item in select variant_id,quantity from public.quote_items where quote_id=q.id order by variant_id loop
   if item.variant_id is not null then
    update public.product_variants set stock=stock+item.quantity where id=item.variant_id;
    insert into public.inventory_movements(variant_id,delta,reason,quote_id,actor_id)
     values(item.variant_id,item.quantity,'Estorno manual por cancelamento',q.id,(select auth.uid()));
   end if;
  end loop;
  update public.quote_requests set stock_reversed_at=now() where id=q.id;
 end if;
 update public.quote_requests set status=p_status,updated_at=now() where id=q.id;
end $$;
revoke all on function public.change_quote_status(uuid,text,boolean) from public,anon;
grant execute on function public.change_quote_status(uuid,text,boolean) to authenticated;
