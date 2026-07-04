/**
 * Phase 18: Add World-Class Knowledge Facts for Marketing Fundamentals
 *
 * Adding frameworks, practical decisions, real examples,
 * FAQs, continue learning paths, and decision frameworks
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

  // World-class additional facts
  const facts = [
    // Frameworks
    {
      id: uuidv4(),
      statement: "The 4Ps Marketing Framework: Product (what you sell), Price (how much you charge), Place (where you sell), Promotion (how you communicate). This classic framework ensures you consider all essential marketing elements for any business strategy.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["framework", "4ps", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "AIDA Framework: Attention (grab customer awareness), Interest (build curiosity), Desire (create want), Action (drive purchase). This customer journey framework helps structure marketing messages to guide prospects through the buying process.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["framework", "aida", "customer-journey"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "SWOT Analysis: Strengths (internal advantages), Weaknesses (internal limitations), Opportunities (external possibilities), Threats (external risks). This strategic planning tool helps assess your position in the market and develop competitive strategies.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["framework", "swot", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Customer Segmentation Framework: Demographic (age, income, location), Psychographic (values, lifestyle), Behavioral (purchasing habits), Geographic (region, climate). Effective segmentation ensures marketing reaches the right audience with relevant messages.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["framework", "segmentation", "targeting"],
      domain: "business",
    },

    // Real Examples
    {
      id: uuidv4(),
      statement: "Apple's marketing success: Focus on product design and user experience over specifications. Create emotional connections through storytelling. Maintain premium pricing through perceived value. Build ecosystem loyalty. This approach makes technology feel accessible and desirable.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["example", "apple", "branding"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Nike's brand strategy: Just Do It campaign emphasizes action and achievement. Sponsorship of elite athletes creates aspirational value. Consistent visual identity across channels. Community building through local events. This transforms shoes into symbols of athletic achievement.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["example", "nike", "branding"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Coca-Cola's content marketing: Share a Coke personalized bottles created viral user-generated content. Emotional storytelling in advertisements focuses on happiness and connection. Consistent brand presence across global markets. This shows how personalization drives engagement.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["example", "coca-cola", "content-marketing"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Airbnb's trust-based marketing: User reviews and host verification build trust. Professional photography makes listings appealing. Local experiences create authentic connections. Community guidelines ensure safety. This demonstrates how marketing can overcome trust barriers in peer-to-peer markets.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["example", "airbnb", "trust"],
      domain: "business",
    },

    // Practical Decision Tools
    {
      id: uuidv4(),
      statement: "Channel selection decision: Choose channels where your audience spends time. B2B: LinkedIn, email, industry publications. B2C: Instagram, TikTok, Facebook. Consider your content type (visual, written, video) and budget when selecting channels. Start with 2-3 channels rather than spreading too thin.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-tool", "channels", "selection"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Budget allocation decision: Use the 70-20-10 rule. 70% to proven channels that work, 20% to testing new opportunities, 10% to experimental ideas. This balances stability with innovation. Adjust percentages based on business stage and risk tolerance.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-tool", "budget", "allocation"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Content format decision: Use video for emotional storytelling and product demos. Use blog posts for SEO and detailed explanations. Use infographics for data visualization. Use social media for engagement and community building. Match format to message and audience preference.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-tool", "content", "format"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Timing decision: Launch campaigns when your audience is most active. B2B: Tuesday-Thursday, business hours. B2C: Weekends and evenings. Consider seasonal trends, holidays, and competitor activity. Test different times to optimize engagement for your specific audience.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-tool", "timing", "scheduling"],
      domain: "business",
    },

    // FAQs
    {
      id: uuidv4(),
      statement: "What's the difference between marketing and sales? Marketing creates awareness and interest. Sales converts that interest into purchases. Marketing focuses on the customer journey before purchase. Sales focuses on closing the transaction. Both are essential and should work together.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "marketing-vs-sales", "comparison"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "How much should I spend on marketing? For established businesses, 5-10% of revenue is typical. For startups, 10-20% is common to build awareness. The right amount depends on your industry, growth goals, and competitive landscape. Track ROI to optimize spending over time.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "budget", "spending"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Which is better: inbound or outbound marketing? Inbound (content, SEO, social) attracts customers organically. Outbound (ads, cold outreach) reaches customers directly. The best approach combines both. Use inbound for long-term growth, outbound for immediate results.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "inbound-vs-outbound", "strategy"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "How do I measure marketing success? Track metrics aligned with goals: Awareness (reach, impressions), Engagement (likes, shares, comments), Conversion (leads, sales), Retention (repeat purchases, lifetime value). Use analytics tools to measure and optimize continuously.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "metrics", "measurement"],
      domain: "business",
    },

    // Continue Learning
    {
      id: uuidv4(),
      statement: "Advanced marketing concepts to explore: Marketing automation, customer lifetime value calculation, attribution modeling, A/B testing methodologies, marketing attribution, customer journey mapping, and marketing technology stack optimization.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "advanced", "concepts"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Digital marketing channels to master: SEO (organic search), PPC (paid search), Email marketing, Social media marketing, Content marketing, Influencer marketing, Affiliate marketing, and Video marketing. Each channel requires specific skills and strategies.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "channels", "digital"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Marketing tools to learn: Google Analytics for measurement, HubSpot for automation, Mailchimp for email, Hootsuite for social media, SEMrush for SEO, Canva for design, and CRM systems for customer management. Master tools that align with your marketing strategy.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "tools", "technology"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Marketing certifications to consider: Google Analytics, Google Ads, Facebook Blueprint, HubSpot Inbound Marketing, and American Marketing Association PCM. Certifications demonstrate expertise and can advance your career in digital marketing.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "certifications", "career"],
      domain: "business",
    },

    // Decision Frameworks
    {
      id: uuidv4(),
      statement: "Marketing strategy decision: Start with clear objectives (awareness, conversion, retention). Define your target audience precisely. Choose channels where they spend time. Create compelling value propositions. Measure results and iterate. Strategy without measurement is guesswork.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "strategy", "planning"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Brand positioning decision: Define what makes your brand unique. Identify customer pain points you solve. Craft a clear value proposition. Ensure consistency across all touchpoints. Positioning is about perception, not just features. Differentiate based on what matters to customers.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "positioning", "branding"],
      domain: "business",
    },
    {
      id: uuidv4(),
      statement: "Campaign launch decision: Test messages with small audiences before full launch. Set clear success metrics before spending. Have tracking in place to measure results. Prepare contingency plans. Launch when you can sustain follow-through. Marketing is a marathon, not a sprint.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "campaigns", "execution"],
      domain: "business",
    },
  ];

  console.log(`Adding ${facts.length} world-class knowledge facts for Marketing Fundamentals...`);

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
  console.log(`\nPrevious total facts: 44`);
  console.log(`New total facts: ${44 + created}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
