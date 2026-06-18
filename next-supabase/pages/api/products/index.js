import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, description, price, category, image_url, stock } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const { data, error } = await supabase.from('products').insert([
      {
        name,
        description: description || '',
        price,
        category,
        image_url: image_url || '',
        stock: stock || 0
      }
    ]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
