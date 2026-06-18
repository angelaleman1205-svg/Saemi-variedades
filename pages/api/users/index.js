import { createRecord, readData } from '../../../lib/db';
import { hashPassword } from '../../../lib/passwords';

function withoutPassword(user) {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export default async function handler(req, res) {
  let users = [];
  try {
    users = await readData('users');
  } catch (error) {
    console.error('Error leyendo usuarios:', error);
    return res.status(500).json({ error: 'No se pudo consultar la base de datos de usuarios' });
  }

  if (req.method === 'GET') {
    const { email } = req.query;
    if (email) {
      const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
      return user ? res.status(200).json(withoutPassword(user)) : res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(users.map(withoutPassword));
  }

  if (req.method === 'POST') {
    const { name, email, password, address, phone, role } = req.body;
    if (!name || !email || !password || !address || !phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const existing = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    try {
      const newUser = await createRecord('users', {
        name,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        address,
        phone,
        role: role || 'cliente'
      });
      return res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creando usuario:', error);
      return res.status(500).json({ error: 'No se pudo crear el usuario' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
