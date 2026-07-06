import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "@/services/renderer/authoring/knowledgeAuthoringOrchestrator";
import { FeatureFlagService } from "@/services/featureFlags/featureFlagService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, topic_slug } = body;

    // Verify secret
    const expectedSecret = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check feature flag
    const featureFlagService = FeatureFlagService.getInstance();
    if (!featureFlagService.shouldUseKnowledgeAuthoringEngine(topic_slug)) {
      return NextResponse.json({ 
        error: "Knowledge Authoring Engine not enabled for this topic",
        enabled: false
      }, { status: 403 });
    }

    const sb = createAdminClient();

    // Get topic ID
    const { data: topic } = await sb
      .from("topics")
      .select("id, category_id")
      .eq("slug", topic_slug)
      .maybeSingle();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Get category
    let category = "general";
    if (topic.category_id) {
      const { data: cat } = await sb
        .from("categories")
        .select("slug")
        .eq("id", topic.category_id)
        .maybeSingle();
      if (cat) category = cat.slug;
    }

    // Get knowledge package
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      return NextResponse.json({ error: "Knowledge package not found" }, { status: 404 });
    }

    // Get facts
    const { data: factsData } = await sb
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", pkg.id)
      .order("created_at");

    const facts = (factsData ?? []).map((f: any) => ({
      id: f.id,
      statement: f.statement,
      factType: f.fact_type,
      confidence: f.confidence,
      scope: f.scope,
      tags: f.tags ?? [],
      domain: f.domain,
    }));

    // Determine intent based on category
    const intent = category === "travel" ? "guide" as const : "educate" as const;

    // Run Knowledge Authoring Engine
    const context: AuthoringContext = {
      topic: topic_slug,
      category,
      subject: category,
      intent,
      complexity: "intermediate",
      facts,
    };

    const orchestrator = new KnowledgeAuthoringOrchestrator();
    const result = await orchestrator.authorDocument(context);

    // Store rendered content
    const { data: renderedOutput } = await sb
      .from("rendered_outputs")
      .insert({
        package_id: pkg.id,
        content: JSON.stringify(result),
        output_format: "json",
        renderer_id: "knowledge-authoring-v1",
        renderer_version: "1.0.0",
        template_version: "1.0.0",
        quality_score: result.editorialResult.qualityScore,
        diagnostics: {
          readerReadiness: result.gapCompletion.readerReadinessScore,
          acceptanceTest: result.acceptanceTest,
          passesAllChecks: result.passesAllChecks,
        },
        status: result.passesAllChecks ? "published" : "draft",
        knowledge_hash: pkg.knowledge_hash,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      outputId: renderedOutput.id,
      qualityScore: result.editorialResult.qualityScore,
      passesAllChecks: result.passesAllChecks,
      recommendation: result.acceptanceTest.recommendation,
      sections: result.document.sections.length,
      readerQuestions: result.readerQuestions.length,
      gapsFilled: result.gapCompletion.filledGacts.length,
    });

  } catch (error) {
    console.error("Knowledge Authoring Engine error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
