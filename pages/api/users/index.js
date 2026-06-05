import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const users = await readData('users');

  if (req.method === 'GET') {
    const { email } = req.query;
    if (email) {
      const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
      return user ? res.status(200).json(user) : res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { name, email, address, phone, role } = req.body;
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const existing = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const newUser = {
      id: `u${Date.now()}`,
      name,
      email: email.toLowerCase(),
      address,
      phone,
      role: role || 'cliente'
    };

    users.push(newUser);
    await writeData('users', users);
    return res.status(201).json(newUser);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
