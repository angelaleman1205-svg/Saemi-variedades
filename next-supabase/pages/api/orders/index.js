import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('orders').select('*, order_items(*)');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { user_id, address, total, items } = req.body;
    if (!user_id || !address || total == null || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Faltan datos del pedido' });
    }

    const { data: order, error: orderError } = await supabase.from('orders').insert([
      {
        user_id,
        address,
        total,
        status: 'Pendiente'
      }
    ]).select('id').single();

    if (orderError) return res.status(500).json({ error: orderError.message });

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) return res.status(500).json({ error: itemsError.message });

    return res.status(201).json({ order_id: order.id });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
