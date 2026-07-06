require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const subjectModels = require('../config/subject-models.json');

const articles = [
  { subjectKey: 'gardening', topicId: '245046dc-993b-4380-8ae9-0f6abda2080e', slug: 'home-renovation' },
  { subjectKey: 'meal-planning', topicId: '4801b2ee-0842-45d6-a99d-2df58752dd29', slug: 'diy-home-repairs' },
  { subjectKey: 'recipes', topicId: '621efa6b-168e-4459-b8fc-0d76e681b9fb', slug: 'baking-basics' },
  { subjectKey: 'programming', topicId: '8f68092d-4b48-4f55-acbe-08371944b374', slug: 'go-programming-language' },
  { subjectKey: 'finance', topicId: '6b2cbb94-0815-485c-a769-1eed7dab49a5', slug: 'credit-scores' },
  { subjectKey: 'cloud', topicId: '9cf0a01a-a309-4998-88f1-ba3c76680682', slug: 'aws-ec2' }
];

function generateStructuredContent(subjectKey, title) {
  const subjectModel = subjectModels.subjects[subjectKey];
  
  let content = `# ${title}\n\n`;
  
  content += `## Overview\n\n`;
  content += `${title} is a fundamental aspect of ${subjectModel.name}. `;
  content += `Understanding ${title} requires knowledge of core concepts such as: ${subjectModel.coreConcepts.slice(0, 3).join(', ')}. `;
  content += `This article provides expert-level guidance on ${title}.\n\n`;
  
  content += `## Core Concepts\n\n`;
  subjectModel.coreConcepts.slice(0, 5).forEach(concept => {
    content += `### ${concept}\n\n`;
    content += `${concept} is essential for mastering ${title}. `;
    content += `Key aspects include understanding how ${concept.toLowerCase()} applies to practical situations.\n\n`;
  });
  
  content += `## Key Terminology\n\n`;
  subjectModel.coreVocabulary.slice(0, 5).forEach(term => {
    content += `- **${term}**: A critical term in ${subjectModel.name} that relates to ${title}.\n`;
  });
  content += `\n`;
  
  content += `## Best Practices\n\n`;
  subjectModel.bestPractices.slice(0, 5).forEach(practice => {
    content += `- ${practice}\n`;
  });
  content += `\n`;
  
  content += `## Common Mistakes to Avoid\n\n`;
  subjectModel.commonMistakes.slice(0, 3).forEach(mistake => {
    content += `- ${mistake}\n`;
  });
  content += `\n`;
  
  content += `## Mental Models\n\n`;
  subjectModel.mentalModels.slice(0, 3).forEach(model => {
    content += `**${model}**: This mental model helps in understanding ${title} from a ${subjectModel.name} perspective.\n\n`;
  });
  
  content += `## Essential Tools\n\n`;
  subjectModel.tools.slice(0, 3).forEach(tool => {
    content += `- ${tool}\n`;
  });
  content += `\n`;
  
  content += `## Frequently Asked Questions\n\n`;
  subjectModel.frequentlyAskedQuestions.slice(0, 3).forEach(faq => {
    const question = faq.question || `Common question about ${title}`;
    const answer = faq.answer || `Detailed answer about ${question} in the context of ${subjectModel.name}`;
    content += `**Q: ${question}**\n\nA: ${answer}\n\n`;
  });
  
  return content;
}

async function showComparisons() {
  const results = [];
  
  for (const article of articles) {
    console.log(`Processing ${article.slug}...`);
    
    const { data, error } = await sb
      .from('topic_translations')
      .select('title, content')
      .eq('topic_id', article.topicId)
      .eq('language_code', 'en')
      .single();
    
    if (error) {
      console.log('ERROR fetching current content:', error.message);
      continue;
    }
    
    const newContent = generateStructuredContent(article.subjectKey, data.title);
    
    results.push({
      slug: article.slug,
      subjectKey: article.subjectKey,
      subjectModelName: subjectModels.subjects[article.subjectKey].name,
      url: `https://knowledge-os.com/topics/${article.slug}`,
      topicId: article.topicId,
      title: data.title,
      currentContent: data.content,
      newContent: newContent,
      currentLength: data.content.length,
      newLength: newContent.length,
      coreConcepts: subjectModels.subjects[article.subjectKey].coreConcepts.slice(0, 5),
      keyTerminology: subjectModels.subjects[article.subjectKey].coreVocabulary.slice(0, 5)
    });
  }
  
  // Save to file
  const outputPath = path.join(__dirname, '../data/article-comparisons.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull comparison saved to: ${outputPath}`);
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  results.forEach(r => {
    console.log(`\n${r.slug} (${r.subjectModelName})`);
    console.log(`URL: ${r.url}`);
    console.log(`Current: ${r.currentLength} chars | New: ${r.newLength} chars`);
    console.log(`Core concepts: ${r.coreConcepts.join(', ')}`);
    console.log(`Key terminology: ${r.keyTerminology.join(', ')}`);
  });
}

showComparisons().catch(console.error);
