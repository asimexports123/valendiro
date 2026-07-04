/**
 * Phase 18: Add World-Class Knowledge Facts for Travel Planning Fundamentals
 *
 * Adding excitement, itineraries, budgets, planning, checklists,
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

  // World-class additional facts
  const facts = [
    // Itineraries
    {
      id: uuidv4(),
      statement: "Sample 7-day European itinerary: Days 1-3 in Paris (Eiffel Tower, Louvre, Montmartre), Days 4-5 in Amsterdam (canals, museums, bike tour), Days 6-7 in Brussels (Grand Place, chocolate shops). This balanced itinerary covers major highlights without rushing.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["itinerary", "europe", "example"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Sample 5-day beach vacation itinerary: Day 1 arrival and beach walk, Day 2 snorkeling and beach relaxation, Day 3 local town exploration, Day 4 boat tour or water sports, Day 5 morning beach time and departure. Leave room for spontaneity and rest.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["itinerary", "beach", "example"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Sample 10-day road trip itinerary: Plan 3-4 hours of driving daily, alternate driving days with rest days, book accommodations ahead for peak locations, allow buffer days for unexpected discoveries. The journey is as important as the destination.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["itinerary", "road-trip", "planning"],
      domain: "travel",
    },

    // Budgets
    {
      id: uuidv4(),
      statement: "Budget breakdown formula: 30% accommodation, 25% food, 20% transportation, 15% activities, 10% miscellaneous/emergency fund. Adjust based on destination costs and travel style. Always include a contingency buffer of 10-20%.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["budget", "allocation", "planning"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Money-saving tips: Travel in shoulder season (spring/fall) for lower prices and fewer crowds. Eat where locals eat instead of tourist restaurants. Use public transportation. Book flights on Tuesday/Wednesday. Consider alternative accommodations like hostels or vacation rentals.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["budget", "savings", "tips"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Hidden costs to budget for: Tourist taxes, resort fees, baggage fees, currency exchange fees, tipping customs, visa costs, travel insurance, emergency medical care, souvenirs, and spontaneous activities. Research destination-specific costs before departure.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["budget", "hidden-costs", "planning"],
      domain: "travel",
    },

    // Checklists
    {
      id: uuidv4(),
      statement: "Essential packing checklist: Passport/ID, tickets/reservations, travel insurance documents, medications, phone charger and adapter, comfortable walking shoes, weather-appropriate clothing, toiletries, small first aid kit, photocopies of important documents.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["checklist", "packing", "essentials"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Pre-departure checklist: Check passport expiration (6+ months validity), apply for visas if needed, inform bank of travel plans, arrange pet/plant care, set up mail hold, pay upcoming bills, download offline maps, research local customs and emergency numbers.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["checklist", "pre-departure", "preparation"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Day-of-travel checklist: Charge all devices, pack chargers, check flight status, arrive at airport early (2-3 hours international), have snacks and entertainment, wear comfortable clothes, keep valuables in carry-on, have local currency or cards ready.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["checklist", "travel-day", "logistics"],
      domain: "travel",
    },

    // FAQs
    {
      id: uuidv4(),
      statement: "How far in advance should I book? For international flights: 2-8 months. For domestic flights: 1-3 months. For accommodations: 1-6 months. For popular destinations or peak seasons: book earlier. Last-minute deals exist but are unpredictable.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "timing", "booking"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Should I buy travel insurance? Yes, especially for international travel, expensive trips, or if you have health concerns. It covers medical emergencies, trip cancellation, lost luggage, and travel delays. Consider the cost vs potential loss.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "insurance", "protection"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "How do I stay safe while traveling? Research destination safety beforehand, register with your embassy, keep copies of documents, stay aware of surroundings, avoid showing valuables, use reputable transportation, trust your instincts, and have emergency contacts saved.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "safety", "security"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "How much cash should I carry? Carry a mix of cash and cards. Have enough local currency for immediate needs (transport, food, tips) but don't carry large amounts. Use ATMs for better exchange rates than currency exchanges. Notify your bank before traveling.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "money", "cash"],
      domain: "travel",
    },

    // Continue Learning
    {
      id: uuidv4(),
      statement: "Advanced travel skills to develop: Basic phrases in local languages, navigating public transportation systems, bargaining in markets, packing light for extended trips, digital nomad lifestyle, solo travel techniques, and sustainable travel practices.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "skills", "advanced"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel resources to explore: Lonely Planet guides, TripAdvisor for reviews, Google Maps for navigation, XE Currency Converter, Google Translate, travel blogs, local tourism websites, and social media travel communities for real-time advice.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "resources", "tools"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Travel types to experience: Cultural immersion (stay with locals), adventure travel (hiking, diving), culinary tourism (food tours), volunteer travel (give back), slow travel (extended stays), and business travel combined with leisure (bleisure).",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "travel-types", "experiences"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Sustainable travel practices: Choose eco-friendly accommodations, respect local ecosystems, support local businesses, minimize plastic use, use public transport, conserve water and energy, and offset carbon emissions from flights when possible.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "sustainability", "ethics"],
      domain: "travel",
    },

    // Decision Frameworks
    {
      id: uuidv4(),
      statement: "Travel destination decision: Consider your interests (beach, culture, adventure), budget, time available, season/weather, safety, and travel companions. Make a shortlist, research each thoroughly, then choose the one that best aligns with your priorities and constraints.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "destination", "selection"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Accommodation decision: Hotels offer convenience and services. Hostels provide social atmosphere and savings. Vacation rentals offer space and kitchen facilities. Consider your budget, travel style, and need for privacy vs social interaction when choosing.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "accommodation", "selection"],
      domain: "travel",
    },
    {
      id: uuidv4(),
      statement: "Transportation decision: Walking is best for exploring cities. Public transport is economical and authentic. Taxis/rideshares offer convenience. Rental cars provide freedom but include parking and navigation challenges. Mix options based on distance, budget, and experience goals.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "transportation", "selection"],
      domain: "travel",
    },
  ];

  console.log(`Adding ${facts.length} world-class knowledge facts for Travel Planning Fundamentals...`);

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
  console.log(`\nPrevious total facts: 41`);
  console.log(`New total facts: ${41 + created}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
