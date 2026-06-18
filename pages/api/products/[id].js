import { deleteRecord, getRecord, updateRecord } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const product = await getRecord('products', id);

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(product);
  }

  if (req.method === 'PUT') {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const updatedProduct = await updateRecord('products', id, {
      ...product,
      name,
      price: Number(price),
      category,
      image: image || product.image
    });
    return res.status(200).json(updatedProduct);
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteRecord('products', id);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
