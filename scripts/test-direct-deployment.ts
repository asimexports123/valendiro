/**
 * Test the specific production deployment URL directly
 */

async function testDirectDeployment() {
  console.log('Testing direct production deployment URL...');
  const response = await fetch('https://knowledge-pfp7vmlcz-asim-s-projects9.vercel.app/en/entity/github', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  const html = await response.text();
  
  console.log('Status:', response.status);
  console.log('Content length:', html.length);
  console.log();
  
  if (html.includes('404') || html.includes('Page not found')) {
    console.log('❌ STILL SHOWING 404');
  } else if (html.includes('GitHub') || html.includes('github')) {
    console.log('✅ SHOWING ENTITY CONTENT');
    console.log('Found "GitHub" in HTML');
  } else if (html.includes('Entity Hub') || html.includes('Knowledge Hub')) {
    console.log('✅ SHOWING ENTITY CONTENT');
    console.log('Found "Entity Hub" or "Knowledge Hub" in HTML');
  } else {
    console.log('⚠️ UNCLEAR - searching for content markers');
    console.log('Contains "GitHub":', html.includes('GitHub') || html.includes('github'));
    console.log('Contains "Entity":', html.includes('Entity'));
    console.log('Contains "Knowledge":', html.includes('Knowledge'));
    console.log('Contains "404":', html.includes('404'));
  }
}

testDirectDeployment();
