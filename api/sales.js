import { put, list } from '@vercel/blob';

// Vercel Serverless Function
// Handles GET (Read DB) and POST (Update DB)
export default async function handler(request, response) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return response.status(500).json({ error: 'Server configuration error: Missing BLOB token' });
  }

  try {
    // GET: Retrieve the latest database
    if (request.method === 'GET') {
      // 1. List files to find our database
      const { blobs } = await list({ token, limit: 100 });
      
      // 2. Find the specific file 'sales_db.json'
      // We look for the exact pathname.
      const dbFile = blobs.find(blob => blob.pathname === 'sales_db.json');

      if (!dbFile) {
        return response.status(404).json({ error: 'Database not found. Please upload data via Admin panel.' });
      }

      // 3. Fetch the content of the file
      // We append a timestamp to the URL to bypass Vercel's internal CDN cache ensuring fresh data
      const fileResponse = await fetch(`${dbFile.url}?t=${Date.now()}`);
      
      if (!fileResponse.ok) {
        return response.status(503).json({ error: 'Failed to fetch file content' });
      }

      const data = await fileResponse.json();
      
      // 4. Return data with cache-control headers to prevent browser caching
      response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return response.status(200).json(data);
    }

    // POST: Upload/Overwrite the database
    if (request.method === 'POST') {
      const data = request.body;

      if (!data || !Array.isArray(data)) {
        return response.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
      }

      // Upload to Vercel Blob
      // addRandomSuffix: false ensures we overwrite the file or keep the URL consistent conceptually
      // access: 'public' is required so we can fetch it via URL if needed
      await put('sales_db.json', JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        token,
        contentType: 'application/json'
      });

      return response.status(200).json({ success: true, count: data.length });
    }

    return response.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}