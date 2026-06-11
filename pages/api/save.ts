import type { NextApiRequest, NextApiResponse } from 'next';
import { saveGame } from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, state } = req.body;
  if (!username || !state) {
    return res.status(400).json({ error: 'Missing username or state' });
  }

  try {
    saveGame(username, JSON.stringify(state));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Save failed' });
  }
}
