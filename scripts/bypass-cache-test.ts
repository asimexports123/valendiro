/**
 * Test entity URL with cache bypass
 */

async function testWithCacheBypass() {
  console.log('Testing entity URL with cache bypass...');
  
  const response = await fetch('https://valendiro.com/en/entity/github', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  const html = await response.text();
  
  console.log('Status:', response.status);
  console.log('Cache headers:', response.headers.get('cache-control'));
  console.log();
  
  if (html.includes('404') || html.includes('Page not found')) {
    console.log('❌ STILL SHOWING 404 (even with cache bypass)');
  } else if (html.includes('GitHub') && html.includes('Entity')) {
    console.log('✅ SHOWING ENTITY CONTENT');
    console.log('First 500 chars:');
    console.log(html.substring(0, 500));
  }
}

testWithCacheBypass();
