import { readData, writeData } from '../../../lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google client ID no configurado en el servidor' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Falta el token de Google' });
  }

  const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  const payload = await verifyResponse.json();

  if (!verifyResponse.ok || payload.aud !== GOOGLE_CLIENT_ID || !['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss)) {
    return res.status(401).json({ error: 'Token de Google inválido' });
  }

  const email = payload.email?.toLowerCase();
  if (!email || payload.email_verified !== 'true' && payload.email_verified !== true) {
    return res.status(400).json({ error: 'El correo de Google no está verificado' });
  }

  const users = await readData('users');
  let user = users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    user = {
      id: `u${Date.now()}`,
      name: payload.name || email.split('@')[0],
      email,
      address: '',
      phone: '',
      role: 'cliente'
    };
    users.push(user);
    await writeData('users', users);
  }

  return res.status(200).json(user);
}
