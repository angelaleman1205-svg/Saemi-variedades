# Saemi-variedades

Esta aplicación usa Supabase para almacenar productos, usuarios y pedidos.

## Variables de entorno necesarias

Configura estas variables en Vercel para que las API de productos y usuarios funcionen correctamente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (opcional para tareas de servidor)

También puedes establecer Google si usas inicio de sesión con Google:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`

> Si los productos no cargan en Vercel y el login falla con errores de base de datos, lo más probable es que faltan estas variables de entorno en la configuración de despliegue.
