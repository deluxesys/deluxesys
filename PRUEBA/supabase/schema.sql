-- Schema SQL para Supabase (Ejecutar en el SQL Editor de Supabase)
create extension if not exists "uuid-ossp";

-- TABLA CLIENTES
create table if not exists public.clientes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nombre text not null,
  telefono text not null,
  cedula text,
  email text,
  direccion text,
  user_id uuid references auth.users(id)
);

-- TABLA ORDENES
create table if not exists public.ordenes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  numero_orden serial not null,
  codigo_seguimiento text not null unique,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  tipo_equipo text not null,
  marca_modelo text not null,
  serie text,
  fallo_reportado text not null,
  diagnostico text,
  estado text default 'Ingresado',
  valor_estimado numeric default 0,
  user_id uuid references auth.users(id)
);

-- Habilitar Seguridad (RLS)
alter table public.clientes enable row level security;
alter table public.ordenes enable row level security;

-- Políticas
create policy "Autenticados ven todo clientes" on public.clientes for select to authenticated using (true);
create policy "Autenticados insertan clientes" on public.clientes for insert to authenticated with check (true);
create policy "Autenticados actualizan clientes" on public.clientes for update to authenticated using (true);
create policy "Autenticados borran clientes" on public.clientes for delete to authenticated using (true);

create policy "Autenticados ven ordenes" on public.ordenes for select to authenticated using (true);
create policy "Autenticados insertan ordenes" on public.ordenes for insert to authenticated with check (true);
create policy "Autenticados actualizan ordenes" on public.ordenes for update to authenticated using (true);
create policy "Autenticados borran ordenes" on public.ordenes for delete to authenticated using (true);
