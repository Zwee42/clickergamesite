import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSave } from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing username' });
  }

  try {
    const data = loadSave(username);
    if (!data) {
      return res.status(404).json({ error: 'No save found' });
    }
    return res.status(200).json(JSON.parse(data));
  } catch (e) {
    return res.status(500).json({ error: 'Load failed' });
  }
}
