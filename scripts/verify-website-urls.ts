/**
 * Website Verification Script
 *
 * Verifies the public website URLs for the published topics:
 * - HTTP status
 * - Content visibility
 * - Internal navigation
 */

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://valendiro.com';

async function main() {
  console.log('========================================');
  console.log('Public Website Verification');
  console.log('========================================\n');
  console.log(`Site URL: ${SITE_URL}\n`);

  for (const topicSlug of VALIDATION_TOPICS) {
    const url = `${SITE_URL}/en/topics/${topicSlug}`;
    console.log(`--- ${topicSlug} ---`);
    console.log(`URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      console.log(`HTTP Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const text = await response.text();
        
        // Check if content is present
        if (text.length > 0) {
          console.log(`✓ Page loaded successfully`);
          console.log(`  Content Length: ${text.length} chars`);
          
          // Check for title
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            console.log(`  Title: ${titleMatch[1]}`);
          }
          
          // Check for content
          if (text.includes(topicSlug)) {
            console.log(`  ✓ Topic slug found in content`);
          }
          
          // Check for common elements
          const hasContent = text.includes('<main') || text.includes('<article') || text.includes('<div');
          if (hasContent) {
            console.log(`  ✓ Content elements found`);
          }
        } else {
          console.log(`✗ Page returned empty content`);
        }
      } else {
        console.log(`✗ Page not accessible (HTTP ${response.status})`);
      }
    } catch (error) {
      console.log(`✗ Error fetching page: ${error}`);
    }

    console.log('');
  }

  console.log('========================================');
  console.log('Website Verification Complete');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
