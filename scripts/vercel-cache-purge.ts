/**
 * Purge Vercel edge cache using Vercel API
 */

async function purgeVercelCache() {
  console.log('Purging Vercel edge cache...');
  
  // This requires Vercel API token
  const token = process.env.VERCEL_TOKEN;
  
  if (!token) {
    console.log('❌ VERCEL_TOKEN not set');
    console.log('Cannot purge cache via API');
    return;
  }
  
  try {
    const response = await fetch('https://api.vercel.com/v1/edge-config/asim-s-projects9/knowledge-os', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Cache purge successful');
    } else {
      console.log('❌ Cache purge failed');
      const text = await response.text();
      console.log('Error:', text);
    }
  } catch (error) {
    console.log('❌ Error purging cache:', (error as Error).message);
  }
}

purgeVercelCache().catch(console.error);
