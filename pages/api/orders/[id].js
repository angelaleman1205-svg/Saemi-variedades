import { deleteRecord, getRecord, updateRecord } from '../../../lib/db';

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

function canAccessOrder(order, userId, role) {
  return canSeeAllOrders(role) || Boolean(userId && (order.userId === userId || order.user?.id === userId));
}

export default async function handler(req, res) {
  const { id } = req.query;
  const order = await getRecord('orders', id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (!canAccessOrder(order, req.query.userId, req.query.role)) {
    return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(order);
  }

  if (req.method === 'PUT') {
    if (!canSeeAllOrders(req.query.role)) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este pedido' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Falta el estado del pedido' });
    }
    const updatedOrder = await updateRecord('orders', id, {
      ...order,
      status
    });
    return res.status(200).json(updatedOrder);
  }

  if (req.method === 'DELETE') {
    if (!canSeeAllOrders(req.query.role)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este pedido' });
    }

    const deleted = await deleteRecord('orders', id);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
