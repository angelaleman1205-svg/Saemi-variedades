import { readData } from '../../../lib/db';
import { verifyPassword } from '../../../lib/passwords';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Metodo no permitido'
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Correo y contrasena requeridos'
    });
  }

  let users = [];
  try {
    users = await readData('users');
  } catch (error) {
    console.error('Error leyendo usuarios:', error);
    return res.status(500).json({
      error: 'No se pudo consultar la base de datos de usuarios'
    });
  }

  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({
      error: 'Usuario no encontrado'
    });
  }

  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({
      error: 'Contrasena incorrecta'
    });
  }

  const { password: _, ...safeUser } = user;
  return res.status(200).json(safeUser);
}
