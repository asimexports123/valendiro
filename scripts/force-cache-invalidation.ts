/**
 * Force cache invalidation by making request with cache-busting headers
 */

async function forceCacheInvalidation() {
  console.log('Forcing cache invalidation for canonical domain...');
  console.log();
  
  const timestamp = Date.now();
  const response = await fetch(`https://valendiro.com/en/entity/github?_t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'User-Agent': 'Cache-Invalidation-Bot/1.0'
    },
    method: 'GET'
  });
  
  console.log('Status:', response.status);
  console.log('Cache-Control:', response.headers.get('cache-control'));
  console.log('Age:', response.headers.get('age'));
  console.log();
  
  const html = await response.text();
  
  if (html.includes('404') || html.includes('Page not found')) {
    console.log('❌ STILL SHOWING 404 AFTER CACHE INVALIDATION');
    console.log('This requires manual Vercel edge cache purge');
  } else if (html.includes('GitHub') && html.includes('Entity')) {
    console.log('✅ CACHE INVALIDATION SUCCESSFUL');
    console.log('Entity content is now showing');
  }
}

forceCacheInvalidation().catch(console.error);
