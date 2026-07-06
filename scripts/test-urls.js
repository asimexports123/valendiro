const urls = [
  '/en/topics/python-programming-fundamentals',
  '/en/topics/git-version-control',
  '/en/topics/html-fundamentals',
  '/en/topics/javascript-fundamentals',
  '/en/topics/restful-apis',
  '/en/topics/sql-fundamentals',
  '/en/topics/software-testing',
  '/en/topics/machine-learning-fundamentals',
  '/en/topics/business-strategy-fundamentals',
  '/en/topics/effective-study-techniques'
];

(async () => {
  console.log('PRODUCTION');
  console.log('---------');
  
  for (const url of urls) {
    try {
      const response = await fetch('https://valendiro.com' + url);
      const content = await response.text();
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : 'No title';
      const renders = response.status === 200 && content.length > 1000;
      const htmlLength = content.length;
      const hasRendererBug = content.includes('headers:{type:') || content.includes('debug') || content.includes('undefined');
      const hasRawCode = content.includes('```') && !content.includes('<div class="code"');
      const h1Matches = content.match(/<h1/g);
      const hasDuplicateH1 = h1Matches && h1Matches.length > 1;
      const hasReferences = content.includes('References') || content.includes('## Sources');
      const hasTOC = content.includes('Table of Contents') || content.includes('toc');
      
      console.log('\n' + url);
      console.log('   HTTP Status: ' + response.status);
      console.log('   Page Title: ' + title);
      console.log('   Article renders? ' + (renders ? 'YES' : 'NO'));
      console.log('   Approx HTML length: ' + htmlLength);
      console.log('   Any renderer bug? ' + (hasRendererBug ? 'YES' : 'NO'));
      console.log('   Any raw code? ' + (hasRawCode ? 'YES' : 'NO'));
      console.log('   Duplicate H1? ' + (hasDuplicateH1 ? 'YES' : 'NO'));
      console.log('   References section? ' + (hasReferences ? 'YES' : 'NO'));
      console.log('   TOC works? ' + (hasTOC ? 'YES' : 'NO'));
    } catch (e) {
      console.log('\n' + url);
      console.log('   HTTP Status: ERROR');
      console.log('   Page Title: ERROR');
      console.log('   Article renders? NO');
      console.log('   Approx HTML length: 0');
      console.log('   Any renderer bug? UNKNOWN');
      console.log('   Any raw code? UNKNOWN');
      console.log('   Duplicate H1? UNKNOWN');
      console.log('   References section? UNKNOWN');
      console.log('   TOC works? UNKNOWN');
    }
  }
})();
