/**
 * Trigger entity URL to generate logs
 */

async function triggerURL() {
  console.log('Triggering entity URL to generate logs...');
  await fetch('https://valendiro.com/en/entity/github');
  console.log('URL triggered. Check Vercel logs for output.');
}

triggerURL();
