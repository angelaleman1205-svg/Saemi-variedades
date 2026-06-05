import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const orders = await readData('orders');
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(orders[index]);
  }

  if (req.method === 'PUT') {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Falta el estado del pedido' });
    }
    orders[index].status = status;
    await writeData('orders', orders);
    return res.status(200).json(orders[index]);
  }

  if (req.method === 'DELETE') {
    const deleted = orders.splice(index, 1)[0];
    await writeData('orders', orders);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
