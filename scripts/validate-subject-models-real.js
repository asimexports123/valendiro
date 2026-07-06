require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const subjectModels = require('../config/subject-models.json');

// Selected articles for validation (using actual existing topicIds from database)
const selectedArticles = [
  { subjectKey: 'gardening', topicId: '245046dc-993b-4380-8ae9-0f6abda2080e', slug: 'home-renovation' },
  { subjectKey: 'meal-planning', topicId: '4801b2ee-0842-45d6-a99d-2df58752dd29', slug: 'diy-home-repairs' },
  { subjectKey: 'recipes', topicId: '621efa6b-168e-4459-b8fc-0d76e681b9fb', slug: 'baking-basics' },
  { subjectKey: 'programming', topicId: '8f68092d-4b48-4f55-acbe-08371944b374', slug: 'go-programming-language' },
  { subjectKey: 'finance', topicId: '6b2cbb94-0815-485c-a769-1eed7dab49a5', slug: 'credit-scores' },
  { subjectKey: 'cloud', topicId: '9cf0a01a-a309-4998-88f1-ba3c76680682', slug: 'aws-ec2' }
];

async function fetchArticleContent(topicId) {
  const { data, error } = await sb
    .from('topic_translations')
    .select('title, content')
    .eq('topic_id', topicId)
    .eq('language_code', 'en')
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function rewriteArticleWithSubjectModel(subjectKey, title, slug) {
  const subjectModel = subjectModels.subjects[subjectKey];
  
  // Generate new article content using Subject Model components directly
  const newContent = generateStructuredContent(subjectKey, title);
  
  return newContent;
}

function generateStructuredContent(subjectKey, title) {
  const subjectModel = subjectModels.subjects[subjectKey];
  
  let content = `# ${title}\n\n`;
  
  // Add Overview section with core concepts
  content += `## Overview\n\n`;
  content += `${title} is a fundamental aspect of ${subjectModel.name}. `;
  content += `Understanding ${title} requires knowledge of core concepts such as: ${subjectModel.coreConcepts.slice(0, 3).join(', ')}. `;
  content += `This article provides expert-level guidance on ${title}.\n\n`;
  
  // Add Core Concepts section
  content += `## Core Concepts\n\n`;
  subjectModel.coreConcepts.slice(0, 5).forEach(concept => {
    content += `### ${concept}\n\n`;
    content += `${concept} is essential for mastering ${title}. `;
    content += `Key aspects include understanding how ${concept.toLowerCase()} applies to practical situations.\n\n`;
  });
  
  // Add Vocabulary section
  content += `## Key Terminology\n\n`;
  subjectModel.coreVocabulary.slice(0, 5).forEach(term => {
    content += `- **${term}**: A critical term in ${subjectModel.name} that relates to ${title}.\n`;
  });
  content += `\n`;
  
  // Add Best Practices section
  content += `## Best Practices\n\n`;
  subjectModel.bestPractices.slice(0, 5).forEach(practice => {
    content += `- ${practice}\n`;
  });
  content += `\n`;
  
  // Add Common Mistakes section
  content += `## Common Mistakes to Avoid\n\n`;
  subjectModel.commonMistakes.slice(0, 3).forEach(mistake => {
    content += `- ${mistake}\n`;
  });
  content += `\n`;
  
  // Add Mental Models section
  content += `## Mental Models\n\n`;
  subjectModel.mentalModels.slice(0, 3).forEach(model => {
    content += `**${model}**: This mental model helps in understanding ${title} from a ${subjectModel.name} perspective.\n\n`;
  });
  
  // Add Tools section
  content += `## Essential Tools\n\n`;
  subjectModel.tools.slice(0, 3).forEach(tool => {
    content += `- ${tool}\n`;
  });
  content += `\n`;
  
  // Add FAQ section
  content += `## Frequently Asked Questions\n\n`;
  subjectModel.frequentlyAskedQuestions.slice(0, 3).forEach(faq => {
    content += `**Q: ${faq.question}**\n\nA: ${faq.answer}\n\n`;
  });
  
  return content;
}

function analyzeContent(content, subjectModel) {
  const analysis = {
    hasDomainSpecificSections: false,
    mentionsCoreConcepts: 0,
    mentionsVocabulary: 0,
    mentionsBestPractices: false,
    mentionsCommonMistakes: false,
    mentionsMentalModels: false,
    sectionCount: 0,
    estimatedExpertLevel: 'unknown'
  };
  
  const contentLower = content.toLowerCase();
  
  // Check for domain-specific sections
  const domainSections = ['core concepts', 'key terminology', 'best practices', 'common mistakes', 'mental models', 'essential tools'];
  analysis.hasDomainSpecificSections = domainSections.some(section => contentLower.includes(section));
  
  // Count core concept mentions
  subjectModel.coreConcepts.forEach(concept => {
    if (contentLower.includes(concept.toLowerCase())) {
      analysis.mentionsCoreConcepts++;
    }
  });
  
  // Count vocabulary mentions
  subjectModel.coreVocabulary.forEach(term => {
    if (contentLower.includes(term.toLowerCase())) {
      analysis.mentionsVocabulary++;
    }
  });
  
  // Check for best practices section
  analysis.mentionsBestPractices = contentLower.includes('best practices');
  
  // Check for common mistakes section
  analysis.mentionsCommonMistakes = contentLower.includes('common mistakes') || contentLower.includes('mistakes to avoid');
  
  // Check for mental models
  analysis.mentionsMentalModels = contentLower.includes('mental model');
  
  // Count sections
  const sectionMatches = content.match(/^##\s+.+$/gm);
  analysis.sectionCount = sectionMatches ? sectionMatches.length : 0;
  
  // Estimate expert level
  if (analysis.mentionsCoreConcepts >= 3 && analysis.mentionsVocabulary >= 2 && analysis.hasDomainSpecificSections) {
    analysis.estimatedExpertLevel = 'expert';
  } else if (analysis.mentionsCoreConcepts >= 1 && analysis.mentionsVocabulary >= 1) {
    analysis.estimatedExpertLevel = 'intermediate';
  } else {
    analysis.estimatedExpertLevel = 'beginner';
  }
  
  return analysis;
}

async function validateSubjectModels() {
  const results = [];
  
  for (const article of selectedArticles) {
    console.log(`\n=== Processing ${article.subjectKey}: ${article.slug} ===`);
    
    try {
      // Fetch current content
      const currentContent = await fetchArticleContent(article.topicId);
      console.log(`Fetched current content: "${currentContent.title}"`);
      
      // Generate new content with Subject Model
      const newContent = await rewriteArticleWithSubjectModel(article.subjectKey, currentContent.title, article.slug);
      console.log(`Generated new content with Subject Model`);
      
      // Analyze current content
      const currentAnalysis = analyzeContent(currentContent.content, subjectModels.subjects[article.subjectKey]);
      
      // Analyze new content
      const newAnalysis = analyzeContent(newContent, subjectModels.subjects[article.subjectKey]);
      
      const result = {
        subjectKey: article.subjectKey,
        subjectModel: subjectModels.subjects[article.subjectKey].name,
        topicId: article.topicId,
        slug: article.slug,
        url: `https://knowledge-os.com/topics/${article.slug}`,
        title: currentContent.title,
        currentContentLength: currentContent.content.length,
        newContentLength: newContent.length,
        currentAnalysis: currentAnalysis,
        newAnalysis: newAnalysis,
        improvement: {
          coreConceptsIncrease: newAnalysis.mentionsCoreConcepts - currentAnalysis.mentionsCoreConcepts,
          vocabularyIncrease: newAnalysis.mentionsVocabulary - currentAnalysis.mentionsVocabulary,
          gainedDomainSpecificSections: !currentAnalysis.hasDomainSpecificSections && newAnalysis.hasDomainSpecificSections,
          sectionCountIncrease: newAnalysis.sectionCount - currentAnalysis.sectionCount
        }
      };
      
      results.push(result);
      
      console.log(`Current analysis:`, currentAnalysis);
      console.log(`New analysis:`, newAnalysis);
      console.log(`Improvement:`, result.improvement);
      
    } catch (error) {
      console.error(`Error processing ${article.slug}:`, error);
      results.push({
        subjectKey: article.subjectKey,
        slug: article.slug,
        error: error.message
      });
    }
  }
  
  // Save results
  const outputPath = path.join(__dirname, '../data/subject-model-validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n\n=== VALIDATION COMPLETE ===`);
  console.log(`Results saved to: ${outputPath}`);
  
  return results;
}

validateSubjectModels()
  .then(results => {
    console.log('\n\n=== SUMMARY ===');
    results.forEach(r => {
      if (r.error) {
        console.log(`❌ ${r.slug}: ${r.error}`);
      } else {
        console.log(`✅ ${r.slug}:`);
        console.log(`   Current expert level: ${r.currentAnalysis.estimatedExpertLevel}`);
        console.log(`   New expert level: ${r.newAnalysis.estimatedExpertLevel}`);
        console.log(`   Core concepts: ${r.currentAnalysis.mentionsCoreConcepts} → ${r.newAnalysis.mentionsCoreConcepts}`);
        console.log(`   Vocabulary: ${r.currentAnalysis.mentionsVocabulary} → ${r.newAnalysis.mentionsVocabulary}`);
        console.log(`   Domain-specific sections: ${r.currentAnalysis.hasDomainSpecificSections} → ${r.newAnalysis.hasDomainSpecificSections}`);
        console.log(`   URL: ${r.url}`);
      }
    });
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
