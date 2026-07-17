/**
 * Test script for controlled publishing API
 */

async function testControlledPublishing() {
  const baseUrl = 'http://localhost:3000';
  
  // First, get a test topic ID from our created dataset
  const topicResponse = await fetch(`${baseUrl}/api/v1/topics?limit=1`);
  const topicData = await topicResponse.json();
  
  if (!topicData.topics || topicData.topics.length === 0) {
    console.log('No test topics found. Creating one first...');
    return;
  }
  
  const testTopic = topicData.topics[0];
  console.log('Test topic found:', testTopic.slug, testTopic.id);
  
  // Test publishing the topic
  const publishResponse = await fetch(`${baseUrl}/api/admin/controlled-publishing/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicId: testTopic.id,
      languageCode: 'en',
      title: testTopic.title,
      content: testTopic.content || '<p>Test content</p>',
      status: 'published'
    })
  });
  
  const publishResult = await publishResponse.json();
  console.log('Publish result:', publishResult);
  
  // Test sitemap
  const sitemapResponse = await fetch(`${baseUrl}/api/sitemap`);
  const sitemapContent = await sitemapResponse.text();
  const inSitemap = sitemapContent.includes(testTopic.slug);
  console.log('Topic in sitemap:', inSitemap);
}

testControlledPublishing().catch(console.error);
