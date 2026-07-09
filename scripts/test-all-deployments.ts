/**
 * Test all recent production deployments to find which one has the working entity page
 */

async function testDeployments() {
  const deployments = [
    'https://knowledge-zn5mi7whj-asim-s-projects9.vercel.app',
    'https://knowledge-n7dsv5e7k-asim-s-projects9.vercel.app',
    'https://knowledge-lai91obto-asim-s-projects9.vercel.app',
    'https://knowledge-41o6wutkp-asim-s-projects9.vercel.app',
    'https://knowledge-1boly4haz-asim-s-projects9.vercel.app',
    'https://knowledge-k3a6lxji0-asim-s-projects9.vercel.app',
  ];
  
  console.log('Testing recent production deployments for entity page...');
  console.log();
  
  for (const deployment of deployments) {
    try {
      const response = await fetch(`${deployment}/en/entity/github`);
      const html = await response.text();
      
      const hasEntityContent = html.includes('GitHub') && !html.includes('404');
      
      console.log(`${deployment.split('//')[1].split('.')[0]}: ${hasEntityContent ? '✅ WORKS' : '❌ 404'}`);
    } catch (error) {
      console.log(`${deployment.split('//')[1].split('.')[0]}: ❌ ERROR`);
    }
  }
}

testDeployments().catch(console.error);
