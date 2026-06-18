import { deleteRecord, getRecord, updateRecord } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const user = await getRecord('users', id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    const { name, email, address, phone, role } = req.body;
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const updatedUser = await updateRecord('users', id, {
      ...user,
      name,
      email: email.toLowerCase(),
      address,
      phone,
      role: role || user.role
    });
    return res.status(200).json(updatedUser);
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteRecord('users', id);
    return res.status(200).json(deleted);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
