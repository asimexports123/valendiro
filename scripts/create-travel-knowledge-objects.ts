/**
 * Create High-Quality Knowledge Objects for Travel Planning Fundamentals
 *
 * Travel Category Personality: Inspire, Guide, Help plan
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
    .eq('slug', 'travel-planning-fundamentals')
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

  // High-quality facts for Travel Planning Fundamentals
  const facts = [
    // Definitions
    {
      id: uuidv4(),
      statement: "Travel planning is the process of organizing all aspects of a trip, from transportation and accommodation to activities and budget. Good planning transforms a vacation into a seamless, memorable experience.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["travel-planning", "organization", "preparation"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "An itinerary is a detailed plan of your travel journey, including dates, destinations, activities, and logistics. It serves as your roadmap while providing flexibility for spontaneous discoveries.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["itinerary", "schedule", "planning"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel insurance provides financial protection against unexpected events like trip cancellations, medical emergencies, lost luggage, or flight delays. It's a safety net that can save you from significant costs.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["travel-insurance", "protection", "safety"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "A travel budget is a financial plan that allocates money for different trip categories like flights, accommodation, food, activities, and shopping. It helps you enjoy your trip without financial stress.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["budget", "finances", "planning"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel documents include passports, visas, identification, and any required permits. These are essential for international travel and must be valid and accessible throughout your journey.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["travel-documents", "passports", "visas"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Packing is the art of selecting and organizing items for your trip. Smart packing balances preparedness with practicality, ensuring you have what you need without overburdening yourself.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["packing", "preparation", "essentials"],
      domain: "travel",
    },

    // Procedural (How to plan)
    {
      id: uuidv4(),
      statement: "To start planning a trip, determine your destination, dates, and budget first. These three decisions will guide all other planning choices and help you narrow down options effectively.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["planning-process", "decisions", "first-steps"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "To book flights, compare prices across multiple airlines and booking sites. Consider nearby airports, flexible dates, and connecting flights to find the best value for your schedule.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["flights", "booking", "comparison"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "To choose accommodation, consider location, price, amenities, and reviews. Staying central may cost more but saves time and transportation costs. Read recent reviews from verified guests.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["accommodation", "hotels", "selection"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "To research destinations, use multiple sources including travel guides, blogs, forums, and social media. Look for recent information as attractions and restaurants can change quickly.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["research", "destinations", "sources"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "To pack efficiently, make a list based on your itinerary and weather. Choose versatile items that mix and match, and roll clothes instead of folding to save space and reduce wrinkles.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["packing", "efficiency", "techniques"],
      domain: "travel",
    },

    // Causal (Why it matters)
    {
      id: uuidv4(),
      statement: "Planning reduces travel stress because you anticipate problems and have solutions ready. Knowing your transportation, accommodation, and activities in advance lets you focus on enjoying the experience.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["stress-reduction", "preparation", "enjoyment"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel insurance is essential because medical emergencies abroad can cost thousands of dollars. Your regular health insurance often doesn't cover international care, leaving you financially vulnerable.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["travel-insurance", "medical", "financial-protection"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Flexible itineraries lead to better experiences because they allow for spontaneous discoveries and adjustments. Over-scheduling can make travel feel like work instead of adventure.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["flexibility", "spontaneity", "experience"],
      domain: "travel",
    },

    // Property (Characteristics)
    {
      id: uuidv4(),
      statement: "Shoulder seasons (spring and fall) often offer the best travel value with fewer crowds, milder weather, and lower prices than peak summer or winter seasons.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["timing", "seasons", "value"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel rewards programs can significantly reduce costs through points, miles, and status benefits. However, they require strategy to maximize value and avoid paying interest on credit cards.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["rewards", "points", "value"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Local transportation varies by destination and can significantly impact your experience. Research options like public transit, rideshares, rental cars, and walking before you arrive.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["transportation", "local", "logistics"],
      domain: "travel",
    },

    // Rule (Best practices)
    {
      id: uuidv4(),
      statement: "Always book flights and accommodation early for better prices and availability. Last-minute bookings often cost more and limit your choices, especially during peak seasons.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["booking", "timing", "best-practices"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Keep digital and physical copies of important documents. Store passport, tickets, and reservations in multiple locations in case of loss or theft.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["documents", "safety", "backup"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Inform your bank of travel plans to avoid having your cards blocked for suspicious activity. Also carry a backup card from a different bank in case one is compromised.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["banking", "cards", "preparation"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Leave buffer time in your itinerary for delays, rest, and unexpected discoveries. Don't schedule every minute - some of the best travel experiences are unplanned.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["itinerary", "buffer-time", "balance"],
      domain: "travel",
    },

    // Warning (Common mistakes)
    {
      id: uuidv4(),
      statement: "Don't overpack. Heavy luggage is difficult to manage, costs extra in baggage fees, and limits your mobility. Most people use only half of what they pack.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["overpacking", "mistakes", "luggage"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Avoid booking connecting flights with tight layovers. Delays are common, and missing a connection can ruin your trip. Allow at least 2 hours for international connections.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["flights", "connections", "mistakes"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Never skip travel insurance for international trips. Medical emergencies, trip cancellations, or lost luggage can cost thousands. The premium is a small price for peace of mind.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["travel-insurance", "risks", "mistakes"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Don't ignore visa requirements. Some countries require visas weeks or months in advance. Check entry requirements for your destination as soon as you start planning.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["visas", "requirements", "mistakes"],
      domain: "travel",
    },

    // Comparison
    {
      id: uuidv4(),
      statement: "Carry-on vs Checked Baggage: Carry-on is faster and avoids lost luggage but has size limits. Checked allows more items but risks loss and delays. For short trips, carry-on is usually sufficient.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["luggage", "comparison", "decision"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Hotels vs Vacation Rentals: Hotels offer services, amenities, and no cleaning. Vacation rentals provide space, kitchens, and local living experience. Choose based on trip length and group size.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["accommodation", "comparison", "decision"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Guided Tours vs Independent Travel: Guided tours provide expertise and logistics handled. Independent travel offers flexibility and deeper local immersion. Consider your experience level and destination complexity.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["travel-style", "comparison", "decision"],
      domain: "travel",
    },

    // Historical
    {
      id: uuidv4(),
      statement: "The modern travel industry began with Thomas Cook's first organized tour in 1841, taking 500 people by train for a temperance meeting. This launched the concept of organized leisure travel.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["history", "thomas-cook", "industry"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Passports became standardized after World War I. Before then, people traveled with letters of introduction from their government. The modern passport system has facilitated safe international travel.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["passports", "history", "documents"],
      domain: "travel",
    },
  ];

  console.log(`Creating ${facts.length} Knowledge Facts for Travel Planning Fundamentals...`);

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
