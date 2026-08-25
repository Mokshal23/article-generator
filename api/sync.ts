import { put, list, del } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { vault } = req.query;
  const rawId = (vault || req.body?.vaultId || 'default').toString().trim().toLowerCase();
  const vaultId = rawId.replace(/[^a-z0-9_-]/g, '') || 'default';
  const pathname = `aeoncat_vaults/${vaultId}.json`;

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: pathname });
      const targetBlob = blobs.find(b => b.pathname === pathname);

      if (!targetBlob) {
        return res.status(404).json({ error: 'No cloud vault found yet for this ID' });
      }

      const response = await fetch(`${targetBlob.url}?t=${Date.now()}`);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to read from Blob storage' });
      }
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const payload = req.body;
      if (!payload || !Array.isArray(payload.articles)) {
        return res.status(400).json({ error: 'Invalid payload: articles array required' });
      }

      // Delete existing blob to avoid stale records
      const { blobs } = await list({ prefix: pathname });
      for (const b of blobs) {
        if (b.pathname === pathname) {
          await del(b.url).catch(() => {});
        }
      }

      const blob = await put(pathname, JSON.stringify(payload), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });

      return res.status(200).json({
        ok: true,
        vaultId,
        url: blob.url,
        updatedAt: Date.now(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Vercel Blob sync error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
