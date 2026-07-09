/**
 * Check actual HTML content from entity URL
 */

async function checkEntityHTML() {
  const response = await fetch('https://valendiro.com/en/entity/github');
  const html = await response.text();
  
  console.log('Status:', response.status);
  console.log('Content length:', html.length);
  console.log();
  
  // Check for 404 indicators
  if (html.includes('404') || html.includes('Page not found') || html.includes('This page does not exist')) {
    console.log('❌ PAGE SHOWS 404');
    console.log('HTML contains 404 indicators');
  } else if (html.includes('GitHub') && html.includes('Entity')) {
    console.log('✅ PAGE SHOWS ENTITY CONTENT');
    console.log('HTML contains entity-related content');
  } else {
    console.log('⚠️ UNCLEAR CONTENT');
    console.log('HTML does not contain clear 404 or entity indicators');
  }
  
  console.log();
  console.log('First 1000 characters:');
  console.log(html.substring(0, 1000));
}

checkEntityHTML().catch(console.error);
