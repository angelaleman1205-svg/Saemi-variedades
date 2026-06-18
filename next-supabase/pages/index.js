import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Saemi Variedades - Next / Supabase</title>
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Saemi Variedades (Next + Supabase)</h1>
        <p>Esta es una carpeta paralela para trabajar con PostgreSQL/Supabase sin tocar la app original.</p>
        <ul>
          <li>Ejecuta `npm install` dentro de `next-supabase`.</li>
          <li>Copia tus credenciales en `.env.local`.</li>
          <li>Ejecuta el SQL en `db/schema.sql` en Supabase.</li>
        </ul>
      </main>
    </>
  );
}
