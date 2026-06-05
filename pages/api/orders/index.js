import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const orders = await readData('orders');

  if (req.method === 'GET') {
    return res.status(200).json(orders);
  }

  if (req.method === 'POST') {
    const { user, items, total, address } = req.body;
    if (!user || !items || !total || !address) {
      return res.status(400).json({ error: 'Faltan datos del pedido' });
    }

    const newOrder = {
      id: `o${Date.now()}`,
      user,
      address,
      items,
      total: Number(total),
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    await writeData('orders', orders);
    return res.status(201).json(newOrder);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
