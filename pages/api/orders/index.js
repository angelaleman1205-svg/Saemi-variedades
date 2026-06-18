import { createRecord, readData } from '../../../lib/db';

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function canSeeAllOrders(role) {
  return ['admin', 'dueno'].includes(normalizeRole(role));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, role } = req.query;
    const orders = await readData('orders');
    if (canSeeAllOrders(role)) {
      return res.status(200).json(orders.filter((order) => order.status === 'Pendiente'));
    }

    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesion para consultar pedidos' });
    }

    return res.status(200).json(orders.filter((order) => order.userId === userId || order.user?.id === userId));
  }

  if (req.method === 'POST') {
    const { user, items, total, address } = req.body;
    if (!user || !items || !total || !address) {
      return res.status(400).json({ error: 'Faltan datos del pedido' });
    }

    const newOrder = await createRecord('orders', {
      user,
      address,
      items,
      total: Number(total),
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    });
    return res.status(201).json(newOrder);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
