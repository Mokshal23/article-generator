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

      // Fetch the blob content using downloadUrl or direct URL with auth
      let data = null;

      // Try 1: Using downloadUrl (pre-signed by Vercel for private blobs)
      if (targetBlob.downloadUrl) {
        try {
          const res = await fetch(targetBlob.downloadUrl);
          if (res.ok) {
            data = await res.json();
          }
        } catch (e) {}
      }

      // Try 2: Using targetBlob.url with Bearer token
      if (!data && targetBlob.url) {
        try {
          const res = await fetch(targetBlob.url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (res.ok) {
            data = await res.json();
          }
        } catch (e) {}
      }

      // Try 3: Using direct unauthenticated URL (if store is public)
      if (!data && targetBlob.url) {
        try {
          const res = await fetch(targetBlob.url);
          if (res.ok) {
            data = await res.json();
          }
        } catch (e) {}
      }

      if (!data) {
        return res.status(502).json({ error: 'Unable to read blob content from storage' });
      }

      return res.status(200).json(data);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const payload = req.body;
      if (!payload || !Array.isArray(payload.articles)) {
        return res.status(400).json({ error: 'Invalid payload: articles array required' });
      }

      // Clean up previous blob
      try {
        const { blobs } = await list({ prefix: pathname, token });
        for (const b of blobs) {
          if (b.pathname === pathname) {
            await del(b.url, { token }).catch(() => {});
          }
        }
      } catch (e) {}

      // Write blob: try private first, fallback to public
      let blob;
      try {
        blob = await put(pathname, JSON.stringify(payload), {
          access: 'private',
          addRandomSuffix: false,
          contentType: 'application/json',
          token,
        });
      } catch (privateErr: any) {
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
