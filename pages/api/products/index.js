import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const products = await readData('products');

  if (req.method === 'GET') {
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const newProduct = {
      id: `p${Date.now()}`,
      name,
      price: Number(price),
      category,
      image: image || '/img/productos/top-1.jpeg'
    };

    products.push(newProduct);
    await writeData('products', products);
    return res.status(201).json(newProduct);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
