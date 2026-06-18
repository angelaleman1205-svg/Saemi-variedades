import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { email } = req.query;
    if (email) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.status(200).json(data);
    }

    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, email, address, phone, password_hash, role } = req.body;
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const { data, error } = await supabase.from('users').insert([
      {
        name,
        email: email.toLowerCase(),
        address,
        phone,
        password_hash: password_hash || null,
        role: role || 'cliente'
      }
    ]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
