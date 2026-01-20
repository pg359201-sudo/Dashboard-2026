import { put, list } from '@vercel/blob';

// Vercel Serverless Function
// Handles GET (Read DB) and POST (Update DB)
export default async function handler(request, response) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // AGGRESSIVE CACHE BUSTING HEADERS
  // These headers tell Vercel Edge Network and the Browser NOT to cache this response ever.
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  response.setHeader('Surrogate-Control', 'no-store');

  if (!token) {
    return response.status(500).json({ error: 'Server configuration error: Missing BLOB token' });
  }

  try {
    // GET: Retrieve the latest database
    if (request.method === 'GET') {
      // 1. List files to find our database
      // We pass a random prefix to 'prefix' just to ensure 'list' doesn't hit a cache (though list usually doesn't)
      const { blobs } = await list({ token, limit: 100 });
      
      const dbFile = blobs.find(blob => blob.pathname === 'sales_db.json');

      if (!dbFile) {
        return response.status(404).json({ error: 'Database not found. Please upload data via Admin panel.' });
      }

      // 3. Fetch the content of the file from Vercel Blob Storage
      // CRITICAL: append timestamp to bypass Vercel internal CDN cache
      const fileResponse = await fetch(`${dbFile.url}?ts=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!fileResponse.ok) {
        return response.status(503).json({ error: 'Failed to fetch file content' });
      }

      const data = await fileResponse.json();
      
      return response.status(200).json(data);
    }

    // POST: Upload/Overwrite the database
    if (request.method === 'POST') {
      const data = request.body;

      if (!data || !Array.isArray(data)) {
        return response.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
      }

      // Upload to Vercel Blob
      // addRandomSuffix: false ensures the URL remains stable (though we query by pathname anyway)
      await put('sales_db.json', JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        token,
        contentType: 'application/json',
        // Set cache control on the file itself in the blob storage
        cacheControlMaxAge: 0 
      });

      return response.status(200).json({ success: true, count: data.length });
    }

    return response.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}