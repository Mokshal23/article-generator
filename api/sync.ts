import { put, list, del } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { vault } = req.query;
  const rawId = (vault || req.body?.vaultId || 'default').toString().trim().toLowerCase();
  const vaultId = rawId.replace(/[^a-z0-9_-]/g, '') || 'default';
  const pathname = `aeoncat_vaults/${vaultId}.json`;

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: pathname, token });
      const targetBlob = blobs.find(b => b.pathname === pathname);

      if (!targetBlob) {
        return res.status(404).json({ error: 'No cloud vault found yet for this ID' });
      }

      // Fetch with Authorization header in case the blob store is private
      const fetchUrl = targetBlob.downloadUrl || targetBlob.url;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${fetchUrl}?t=${Date.now()}`, { headers });
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
      try {
        const { blobs } = await list({ prefix: pathname, token });
        for (const b of blobs) {
          if (b.pathname === pathname) {
            await del(b.url, { token }).catch(() => {});
          }
        }
      } catch (e) {
        // Ignore list/delete errors
      }

      // Attempt put with 'private' access first (for private stores), fallback to 'public' if store is public
      let blob;
      try {
        blob = await put(pathname, JSON.stringify(payload), {
          access: 'private',
          addRandomSuffix: false,
          contentType: 'application/json',
          token,
        });
      } catch (privateErr: any) {
        // If the store is public and rejected 'private', try 'public'
        blob = await put(pathname, JSON.stringify(payload), {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'application/json',
          token,
        });
      }

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
