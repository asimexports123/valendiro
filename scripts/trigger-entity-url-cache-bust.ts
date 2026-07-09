/**
 * Trigger entity URL with cache busting
 */

async function triggerURL() {
  console.log('Triggering entity URL with cache busting...');
  const timestamp = Date.now();
  await fetch(`https://valendiro.com/en/entity/github?t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  console.log('URL triggered. Check Vercel logs for output.');
}

triggerURL();
