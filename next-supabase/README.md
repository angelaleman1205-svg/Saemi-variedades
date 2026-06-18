# Saemi Variedades - Next + Supabase

Esta carpeta es una versión separada del frontend/backend para usar PostgreSQL en Supabase sin tocar los datos de la app principal.

## Estructura
- `db/schema.sql` — esquema principal de la base de datos PostgreSQL
- `lib/supabaseClient.js` — cliente de Supabase
- `pages/api/*` — rutas API básicas para productos, usuarios y pedidos

## Uso
1. Crear un proyecto en Supabase.
2. Copiar las variables de entorno en `next-supabase/.env.local`.
3. Ejecutar el SQL de `next-supabase/db/schema.sql` en Supabase.
4. Ejecutar `npm install` dentro de `next-supabase`.
5. Lanzar con `npm run dev`.

## Variables de entorno
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (opcional para tareas de servidor)
