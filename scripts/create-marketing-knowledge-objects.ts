/**
 * Create High-Quality Knowledge Objects for Marketing Fundamentals
 *
 * Business Category Personality: Help readers make better decisions
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the topic
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id')
    .eq('slug', 'marketing-fundamentals')
    .single();

  if (topicError || !topic) {
    console.error('Error: Topic not found');
    process.exit(1);
  }

  // Get the knowledge package
  const { data: packageData, error: packageError } = await supabase
    .from('knowledge_packages')
    .select('id')
    .eq('topic_id', topic.id)
    .single();

  if (packageError || !packageData) {
    console.error('Error: Knowledge Package not found');
    process.exit(1);
  }

  // High-quality facts for Marketing Fundamentals
  const facts = [
    // Definitions
    {
      id: uuidv4(),
      statement: "Marketing is the process of creating, communicating, and delivering value to customers. It's not just selling - it's understanding customer needs and building relationships that benefit both parties.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["marketing", "value", "customer-focus"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Target market segmentation divides a broad audience into groups based on demographics, behavior, or needs. This allows businesses to tailor their message to specific segments rather than trying to appeal to everyone.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["segmentation", "targeting", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Brand positioning defines how a company wants customers to perceive its product relative to competitors. It's the unique space a brand occupies in customers' minds based on value proposition and differentiation.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["branding", "positioning", "differentiation"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Content marketing creates valuable information to attract and engage audiences rather than directly promoting products. It builds trust and authority, making customers more likely to choose your brand when ready to buy.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["content-marketing", "value", "engagement"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Search engine optimization (SEO) improves a website's ranking in search results to drive organic traffic. It's about making your content discoverable when people search for solutions you provide.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["seo", "search", "traffic"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Email marketing delivers targeted messages directly to subscribers and consistently produces high return on investment. It's effective because you're reaching people who have already expressed interest in your brand.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["email-marketing", "direct", "roi"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Social media marketing builds brand awareness and customer relationships through platforms like Instagram and LinkedIn. It's about engaging in conversations, not just broadcasting messages.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["social-media", "engagement", "awareness"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "A conversion rate measures the percentage of visitors who complete a desired action such as making a purchase or filling out a form. It's a key metric for evaluating marketing effectiveness.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["conversion-rate", "metrics", "performance"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Customer lifetime value (CLV) estimates the total revenue a customer generates throughout their relationship with a business. This metric helps determine how much to spend on acquiring new customers.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["clv", "customer-value", "metrics"],
      domain: "business",
    },

    // Procedural (How to market)
    {
      id: uuidv4(),
      statement: "To develop a marketing strategy, start by defining your target audience and their pain points. Then determine your unique value proposition and choose channels that reach your audience where they spend time.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["strategy", "planning", "process"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "To create effective content, focus on solving customer problems rather than promoting features. Use storytelling to make your message memorable and include clear calls to action.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["content-creation", "effectiveness", "storytelling"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "To improve SEO, research keywords your audience uses and create content that answers their questions. Optimize technical aspects like page speed and mobile-friendliness, and build quality backlinks.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["seo", "optimization", "technical"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "To measure marketing success, track metrics that align with business goals like revenue, customer acquisition cost, and retention. Use analytics to understand what's working and optimize accordingly.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["metrics", "measurement", "analytics"],
      domain: "business",
    },

    // Causal (Why it works)
    {
      id: uuidv4(),
      statement: "Marketing works because it addresses customer needs and desires. People buy solutions to problems, not products. When marketing clearly communicates value, it naturally leads to sales.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["customer-needs", "value", "psychology"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Trust is essential in marketing because people buy from brands they believe will deliver on promises. Consistent messaging, quality products, and good customer service build this trust over time.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["trust", "credibility", "relationships"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Multiple touchpoints increase conversion because customers need multiple exposures before making purchase decisions. Each interaction builds familiarity and confidence in your brand.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["touchpoints", "frequency", "conversion"],
      domain: "business",
    },

    // Property (Characteristics)
    {
      id: uuidv4(),
      statement: "Digital marketing offers precise targeting and measurement compared to traditional advertising. You can reach specific demographics, track results in real-time, and adjust campaigns based on performance data.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["digital-marketing", "targeting", "measurement"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Marketing channels vary in effectiveness by audience and industry. B2B success often comes from LinkedIn and email, while B2C typically performs better on Instagram and Facebook.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["channels", "b2b", "b2c"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Brand consistency across all touchpoints builds recognition and trust. When customers see the same messaging, visuals, and experience everywhere, it reinforces your brand identity.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["brand-consistency", "recognition", "trust"],
      domain: "business",
    },

    // Rule (Best practices)
    {
      id: uuidv4(),
      statement: "Always put the customer first in marketing decisions. Ask how each tactic helps solve customer problems or improve their experience. Customer-centric marketing outperforms product-centric marketing.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["customer-centric", "focus", "best-practices"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Test and optimize continuously. What works today may not work tomorrow. Run A/B tests on headlines, calls to action, and offers to continuously improve performance.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["testing", "optimization", "continuous"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Focus on quality over quantity in content and outreach. One excellent piece of content that genuinely helps customers is worth more than ten mediocre pieces that add no value.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["quality", "content", "value"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Align marketing with sales. Both teams should work together on messaging, lead qualification, and customer feedback. Marketing and sales alignment significantly increases conversion rates.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["alignment", "sales", "collaboration"],
      domain: "business",
    },

    // Warning (Common mistakes)
    {
      id: uuidv4(),
      statement: "Don't chase vanity metrics like likes and followers. These don't necessarily translate to business results. Focus on metrics that impact revenue like conversion rates and customer acquisition cost.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["vanity-metrics", "mistakes", "focus"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Avoid being everywhere at once. Spreading resources too thin across too many channels leads to mediocre results everywhere. Focus on channels where your audience actually spends time.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["channel-overload", "mistakes", "focus"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Never ignore customer feedback. Negative reviews and complaints are opportunities to improve and show customers you care. Ignoring them damages your reputation and loses customers.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["feedback", "reputation", "mistakes"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Don't assume you know what customers want. Research and test your assumptions. Many failed marketing campaigns result from businesses promoting what they think customers need rather than what customers actually want.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["assumptions", "research", "mistakes"],
      domain: "business",
    },

    // Comparison
    {
      id: uuidv4(),
      statement: "Inbound vs Outbound Marketing: Inbound attracts customers through content and SEO. Outbound reaches out through advertising and cold outreach. Inbound builds long-term relationships, outbound generates faster results.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["inbound-vs-outbound", "comparison", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Organic vs Paid Marketing: Organic marketing builds long-term traffic through SEO and content. Paid marketing delivers immediate results through ads. A balanced approach uses both for sustainable growth.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["organic-vs-paid", "comparison", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Marketing vs Sales: Marketing creates awareness and interest. Sales converts that interest into purchases. Both are essential - marketing without sales is wasted effort, sales without marketing is difficult.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["marketing-vs-sales", "comparison", "collaboration"],
      domain: "business",
    },

    // Historical
    {
      id: uuidv4(),
      statement: "Modern marketing began with the Industrial Revolution when mass production created supply that exceeded local demand. Businesses needed to reach broader markets, leading to the development of advertising and brand building.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["history", "industrial-revolution", "evolution"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Digital marketing emerged in the 1990s with the commercialization of the internet. The first banner ad appeared in 1994, and Google AdWords launched in 2000, revolutionizing how businesses reach customers.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["digital-marketing", "history", "internet"],
      domain: "business",
    },
  ];

  console.log(`Creating ${facts.length} Knowledge Facts for Marketing Fundamentals...`);

  // Insert knowledge facts
  let created = 0;
  let errors = 0;

  for (const fact of facts) {
    const { error: insertError } = await supabase
      .from('knowledge_facts')
      .insert({
        id: fact.id,
        package_id: packageData.id,
        statement: fact.statement,
        fact_type: fact.factType,
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope,
        tags: fact.tags,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`Error inserting fact: ${insertError.message}`);
      errors++;
    } else {
      created++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${facts.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
