import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const products = await readData('products');
  const index = products.findIndex((product) => product.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(products[index]);
  }

  if (req.method === 'PUT') {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    products[index] = {
      ...products[index],
      name,
      price: Number(price),
      category,
      image: image || products[index].image
    };
    await writeData('products', products);
    return res.status(200).json(products[index]);
  }

  if (req.method === 'DELETE') {
    const deleted = products.splice(index, 1)[0];
    await writeData('products', products);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
