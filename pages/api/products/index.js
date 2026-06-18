import { createRecord, readData } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const products = await readData('products');
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const newProduct = await createRecord('products', {
      name,
      price: Number(price),
      category,
      image: image || '/img/productos/top-1.jpeg'
    });
    return res.status(201).json(newProduct);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
