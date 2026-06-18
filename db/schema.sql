create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text,
  role text not null default 'cliente',
  address text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  category text not null,
  image_url text,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  address text not null,
  total numeric(10,2) not null,
  status text not null default 'Pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

insert into public.users (name, email, password_hash, address, phone, role)
select name, email, password_hash, address, phone, role
from (values
  (
    'Admin',
    'angelaleman1205@gmail.com',
    'scrypt:bc6ed794b648cd35db4c52c8d2ae0b40:e3d50980e9a674b2ce94cc7c80b29d1083393a17ebcacdf61d7f591834fcd2fc714f604cee7220c76fdd09de228d1c50b5465c1209b1bc3e71245d7b929d8ee6',
    'Oficina central',
    '3000000001',
    'admin'
  ),
  (
    'Dueno',
    'luzangela10091997@gmail.com',
    'scrypt:90da073397a9715774aff2cdb095bca4:c4d6dbec3556d496c83c75f84844e00b4f727f1425fea9bf80f4f8dc2833ae31dd0e8d881ee88f0781a72d0f254e22c9c066083ba61e43c7e0885da5d86d4cdb',
    'Tienda principal',
    '3000000002',
    'dueno'
  ),
  (
    'Cliente',
    'cliente@saemi.com',
    'scrypt:f7c3b4c2697e99685a8e23414d79600a:18e9a94481d0c559dfea78616970feee8e031e3555f99a40f2fea57a35e6f0941f8e2390ab87f48e6211a68a4df8471fcb0fb5ee2c6a4c867c9d3de090d3393a',
    'Calle 123',
    '3000000003',
    'cliente'
  )
) as seed_users(name, email, password_hash, address, phone, role)
where not exists (
  select 1
  from public.users
  where users.email = seed_users.email
);

insert into public.products (name, price, category, image_url)
select name, price, category, image_url
from (values
  ('Body Rosado', 30000, 'mujeres', '/img/productos/body-1.jpeg'),
  ('Body Camel', 27000, 'mujeres', '/img/productos/body-2.jpeg'),
  ('Body Colombia', 30000, 'mujeres', '/img/productos/body-3.jpeg'),
  ('Top Tamara', 20000, 'mujeres', '/img/productos/top-1.jpeg'),
  ('Top Noah Camel', 30000, 'mujeres', '/img/productos/top-2.jpeg'),
  ('Top Esperanza', 25000, 'mujeres', '/img/productos/top-3.jpeg'),
  ('Combo Belleza Especial', 67000, 'mujeres', '/img/productos/combo-1.jpeg'),
  ('Splash + Mantequilla', 32000, 'mujeres', '/img/productos/combo-2.jpeg'),
  ('Buzo Naia Blanco', 35000, 'hombres', '/img/productos/buzo-naia.jpeg'),
  ('Falda Globo Camel', 35000, 'mujeres', '/img/productos/falda.jpeg'),
  ('Bafle Rosado Bluetooth', 40000, 'electrodomesticos', '/img/productos/bafle.jpeg'),
  ('Mini Licuadora Azul', 30000, 'electrodomesticos', '/img/productos/licuadora.jpeg'),
  ('EarPods USB-C Apple', 14000, 'electrodomesticos', '/img/productos/audifonos.jpeg'),
  ('Mega Set de Arte 208 Pzas', 55000, 'niÃ±os', '/img/productos/arte.jpeg'),
  ('Tablero Didactico Kuromi', 22000, 'niÃ±os', '/img/productos/tablero.jpeg'),
  ('Lonchera Encanto', 10000, 'niÃ±os', '/img/productos/lonchera.jpeg'),
  ('Bolso Infantil 3 en 1', 50000, 'niÃ±os', '/img/productos/bolso.jpeg'),
  ('Plancha de Vapor', 72000, 'hogar', '/img/productos/plancha.jpeg')
) as seed_products(name, price, category, image_url)
where not exists (
  select 1
  from public.products
  where products.name = seed_products.name
);
