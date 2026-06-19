import { createRecord, readData } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const products = await readData('products');
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error leyendo productos:', error);
      return res.status(500).json({ error: 'No se pudo consultar la base de datos de productos' });
    }
  }

  if (req.method === 'POST') {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
      const newProduct = await createRecord('products', {
        name,
        price: Number(price),
        category,
        image: image || '/img/productos/top-1.jpeg'
      });
      return res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creando producto:', error);
      return res.status(500).json({ error: 'No se pudo crear el producto' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
