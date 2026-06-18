import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etwrjmdfahyjclcyodlj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔌 Intentando conectar a Supabase...');
    const { data, error } = await supabase.from('products').select('count').single();

    if (error) {
      console.error('❌ Error de conexión:', error.message);
      process.exit(1);
    }

    console.log('✅ Conexión exitosa con Supabase');
    console.log('📊 Respuesta:', data);
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
}

testConnection();
