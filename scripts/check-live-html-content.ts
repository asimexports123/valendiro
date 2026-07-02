async function main() {
  const response = await fetch("https://valendiro.com/en/topics/machine-learning-basics");
  const html = await response.text();
  
  const hasArticle = html.includes("<article");
  const hasKnowledgeArticle = html.includes("knowledge-article");
  const hasH1 = html.includes("<h1");
  const hasMachineLearning = html.includes("Machine Learning Basics");
  const hasV2Content = html.includes("What is Machine Learning Basics?");
  const hasAlgorithms = html.includes("algorithms, training, and evaluation");
  
  console.log("Live site HTML analysis:");
  console.log(`  Has <article> tag: ${hasArticle}`);
  console.log(`  Has knowledge-article class: ${hasKnowledgeArticle}`);
  console.log(`  Has <h1> tag: ${hasH1}`);
  console.log(`  Has \"Machine Learning Basics\": ${hasMachineLearning}`);
  console.log(`  Has v2 subtitle: ${hasV2Content}`);
  console.log(`  Has v2 description: ${hasAlgorithms}`);
  
  // Find article content
  const articleStart = html.indexOf("<article");
  if (articleStart > -1) {
    const articleEnd = html.indexOf("</article>", articleStart);
    if (articleEnd > -1) {
      const articleContent = html.substring(articleStart, articleEnd + 10);
      console.log(`\nArticle content length: ${articleContent.length} chars`);
      console.log(`Article preview: ${articleContent.substring(0, 500)}`);
    }
  }
}

main();
