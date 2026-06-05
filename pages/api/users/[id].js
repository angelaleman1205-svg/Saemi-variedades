import { readData, writeData } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const users = await readData('users');
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(users[index]);
  }

  if (req.method === 'PUT') {
    const { name, email, address, phone, role } = req.body;
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    users[index] = {
      ...users[index],
      name,
      email: email.toLowerCase(),
      address,
      phone,
      role: role || users[index].role
    };
    await writeData('users', users);
    return res.status(200).json(users[index]);
  }

  if (req.method === 'DELETE') {
    const deleted = users.splice(index, 1)[0];
    await writeData('users', users);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
