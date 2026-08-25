// Vercel Serverless Sync Handler
const vaults = new Map<string, any>();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { vault } = req.query;
  const vaultId = (vault || req.body?.vaultId || 'default').toString().trim().toLowerCase();

  if (req.method === 'GET') {
    const data = vaults.get(vaultId);
    if (!data) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: 'No data provided' });
    }
    vaults.set(vaultId, {
      ...body,
      updatedAt: Date.now()
    });
    return res.status(200).json({ ok: true, vaultId, updatedAt: Date.now() });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
