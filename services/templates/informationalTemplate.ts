import { TemplateData, TemplatedArticle } from "./articleTemplateEngine";
import { generateMetaTitle, generateMetaDescription, renderProductBlock } from "./articleTemplateEngine";

export function buildInformationalArticle(data: TemplateData, generatedAt: string): TemplatedArticle {
  const relatedTopics = data.relatedTopics || [];
  const relatedQuestions = data.relatedQuestions || [];
  const entities = data.entities || [];
  const keywords = data.keywords || [data.title.toLowerCase()];
  const title = data.title;
  const desc = data.description
    ? data.description.trim()
    : `${title} is an important topic that spans practical applications, core theory, and real-world use cases.`;

  // ── Introduction ─────────────────────────────────────────────────────────────
  const intro = [
    `# ${title}`,
    "",
    desc,
    "",
    `Whether you are new to ${title} or looking to deepen your understanding, this guide covers everything from the foundational concepts to advanced insights, real examples, and common mistakes to avoid.`,
    "",
  ];

  // ── Definition ───────────────────────────────────────────────────────────────
  const definition = [
    `## What Is ${title}?`,
    "",
    `${title} refers to the body of knowledge, skills, and practices surrounding this subject. At its core, it encompasses the principles that define how things work and why they matter in context.`,
    "",
    `A clear understanding of ${title} starts with recognizing its scope: it is not a single idea but a structured field with distinct components, each of which builds on the others.`,
    "",
  ];

  // ── Key Concepts ─────────────────────────────────────────────────────────────
  const keyConcepts = [
    "## Key Concepts",
    "",
    `The following concepts form the foundation of ${title}:`,
    "",
    ...(entities.length > 0
      ? entities.map((e) => `- **${e.name}**: ${e.description ?? `A core component within ${title}.`}`)
      : [
          `- **Fundamentals**: The basic principles every learner must understand before advancing.`,
          `- **Methodology**: The structured approach used to apply ${title.toLowerCase()} in real scenarios.`,
          `- **Best Practices**: Established patterns that lead to consistently good outcomes.`,
          `- **Common Terminology**: The language used by practitioners in this field.`,
        ]),
    "",
  ];

  // ── How It Works ─────────────────────────────────────────────────────────────
  const howItWorks = [
    `## How ${title} Works`,
    "",
    `${title} operates through a combination of theory and applied practice. The process typically involves:`,
    "",
    `1. **Understanding the problem domain** — before applying ${title.toLowerCase()}, define the scope and goals clearly.`,
    `2. **Selecting the right approach** — different situations require different strategies; knowing which to apply is a core skill.`,
    `3. **Execution and iteration** — apply the chosen method, observe the results, and refine based on real feedback.`,
    `4. **Measuring outcomes** — use specific metrics to evaluate whether the approach achieved its intended goal.`,
    "",
    `This cycle repeats as you build mastery over time.`,
    "",
  ];

  // ── Real Examples ─────────────────────────────────────────────────────────────
  const examples = [
    "## Real-World Examples",
    "",
    `To make ${title} concrete, consider these practical scenarios:`,
    "",
    `- **Beginner scenario**: A newcomer uses ${title.toLowerCase()} to solve a straightforward problem, building confidence with the basics.`,
    `- **Intermediate scenario**: A practitioner combines multiple techniques from ${title.toLowerCase()} to tackle a more complex challenge.`,
    `- **Advanced scenario**: An expert applies ${title.toLowerCase()} at scale, integrating it into larger systems or workflows with measurable impact.`,
    "",
    `These examples illustrate that ${title} is applicable across experience levels and real-world contexts.`,
    "",
  ];

  // ── Advantages ────────────────────────────────────────────────────────────────
  const advantages = [
    `## Advantages of ${title}`,
    "",
    `Understanding and applying ${title} offers significant benefits:`,
    "",
    `- **Efficiency**: Reduces wasted effort by providing proven frameworks and patterns.`,
    `- **Clarity**: Gives practitioners a shared vocabulary and structured way of thinking.`,
    `- **Outcomes**: Consistent application leads to measurably better results.`,
    `- **Career growth**: Expertise in ${title.toLowerCase()} is valued across industries.`,
    "",
  ];

  // ── Limitations ───────────────────────────────────────────────────────────────
  const limitations = [
    `## Limitations and Considerations`,
    "",
    `Like any field, ${title} has constraints worth understanding:`,
    "",
    `- **Context dependency**: What works in one environment may not transfer directly to another.`,
    `- **Learning curve**: Mastery requires time, deliberate practice, and access to quality resources.`,
    `- **Evolution**: The field continues to develop; staying current requires ongoing learning.`,
    `- **Misapplication risk**: Applying the wrong technique to a problem can produce worse results than no technique at all.`,
    "",
    `Being aware of these limitations helps practitioners apply ${title.toLowerCase()} more effectively.`,
    "",
  ];

  // ── Comparison ────────────────────────────────────────────────────────────────
  const comparison = [
    "## Comparison with Related Approaches",
    "",
    `${title} is often compared with similar concepts. The key distinctions are:`,
    "",
    `| Aspect | ${title} | Alternative Approach |`,
    `|--------|${"-".repeat(title.length + 2)}|----------------------|`,
    `| Focus | Structured and systematic | Ad hoc or intuitive |`,
    `| Scalability | Designed to scale with complexity | May not scale well |`,
    `| Learning path | Clear progression from beginner to advanced | Often self-directed |`,
    `| Community | Established community and resources | Variable support |`,
    "",
  ];

  // ── Common Mistakes ───────────────────────────────────────────────────────────
  const mistakes = [
    `## Common Mistakes to Avoid`,
    "",
    `Practitioners new to ${title} frequently encounter these pitfalls:`,
    "",
    `1. **Skipping fundamentals**: Jumping to advanced techniques without solid grounding leads to fragile understanding.`,
    `2. **Over-engineering**: Applying complex solutions to simple problems wastes time and introduces unnecessary risk.`,
    `3. **Ignoring feedback loops**: Not measuring results means missing opportunities to improve.`,
    `4. **Working in isolation**: ${title} benefits from peer review and shared learning — avoid siloing your practice.`,
    "",
  ];

  // ── FAQ ───────────────────────────────────────────────────────────────────────
  const faqItems: string[] = [];
  if (relatedQuestions.length > 0) {
    for (const q of relatedQuestions.slice(0, 5)) {
      const answer = q.answer && q.answer.trim().length > 20
        ? q.answer.trim()
        : `This is a frequently asked question about ${title.toLowerCase()}. The answer depends on your specific context, but the core principles of ${title.toLowerCase()} provide a reliable framework for addressing it.`;
      faqItems.push(`### ${q.question_text}`, "", answer, "");
    }
  } else {
    faqItems.push(
      `### What is the best way to get started with ${title}?`,
      "",
      `Begin with the foundational concepts outlined in this guide. Focus on understanding the core principles before moving to advanced applications.`,
      "",
      `### How long does it take to learn ${title}?`,
      "",
      `The timeline varies by prior experience and learning intensity, but most learners develop practical proficiency within 3–6 months of consistent study and application.`,
      "",
      `### Is ${title} relevant in ${new Date().getFullYear()}?`,
      "",
      `Absolutely. The principles covered here are evergreen and continue to be applied across industries and contexts.`,
      "",
    );
  }
  const faq = ["## Frequently Asked Questions", "", ...faqItems];

  // ── Related Topics ────────────────────────────────────────────────────────────
  const related = relatedTopics.length > 0
    ? [
        "## Related Topics",
        "",
        `Deepen your knowledge by exploring these related areas:`,
        "",
        ...relatedTopics.slice(0, 8).map((t) => `- **${t.title}**`),
        "",
      ]
    : [];

  // ── Conclusion ────────────────────────────────────────────────────────────────
  const conclusion = [
    "## Conclusion",
    "",
    `${title} is a foundational subject with broad applications and lasting relevance. This guide covered the definition, key concepts, how it works, real examples, advantages, limitations, and the most common mistakes to avoid.`,
    "",
    `The next step is to apply what you have learned in a real context. Start small, iterate, and build on each success. Consistent practice is what separates understanding from mastery.`,
    "",
  ];

  // ── Products (optional) ────────────────────────────────────────────────────────
  const productSection = data.products && data.products.length > 0 ? [renderProductBlock(data.products, 3)] : [];

  const sections = [
    ...intro,
    ...definition,
    ...keyConcepts,
    ...howItWorks,
    ...examples,
    ...advantages,
    ...limitations,
    ...comparison,
    ...mistakes,
    ...faq,
    ...related,
    ...productSection,
    ...conclusion,
  ];

  const content = sections.join("\n");
  const excerpt = sections.find((l) => l.length > 80 && !l.startsWith("#")) ?? content.slice(0, 280).trim();

  return {
    title,
    excerpt: excerpt.trim(),
    content,
    metaTitle: generateMetaTitle(title),
    metaDescription: generateMetaDescription(title, data.description),
    keywords,
    languageCode: data.languageCode,
    generatedAt,
  };
}
