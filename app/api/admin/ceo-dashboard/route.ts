import { NextResponse } from "next/server";
import { AgentRegistry } from "@/services/agents/agentRegistry";
import { TaskQueue } from "@/services/agents/taskQueue";
import { SharedMemory } from "@/services/agents/sharedMemory";
import { AgentCommunication } from "@/services/agents/agentCommunication";
import { getDashboardMetrics } from "@/services/admin/dashboardData";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const registry = AgentRegistry.getInstance();
    const queue = TaskQueue.getInstance();
    const memory = SharedMemory.getInstance();
    const communication = AgentCommunication.getInstance();

    const registryStats = registry.getStatistics();
    const queueStats = queue.getStatistics();
    const memoryStats = memory.getStatistics();
    const commStats = communication.getStatistics();

    // Read migration queue data
    let migrationQueueData = null;
    try {
      const queuePath = path.join(process.cwd(), 'data/migration-queue.json');
      if (fs.existsSync(queuePath)) {
        const data = fs.readFileSync(queuePath, 'utf8');
        migrationQueueData = JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading migration queue:', e);
    }

    const blueprintMetrics = {
      complianceRate: migrationQueueData?.statistics?.complianceRate ?? 0,
      migrationQueueSize: migrationQueueData?.statistics?.articlesNeedingMigration ?? 0,
      migrationProgress: migrationQueueData?.statistics?.totalPublishedTopics > 0
        ? ((migrationQueueData?.statistics?.compliantArticles ?? 0) / migrationQueueData.statistics.totalPublishedTopics) * 100
        : 100
    };

    const dashboardData = {
      timestamp: new Date().toISOString(),
      
      // Knowledge Coverage
      knowledgeCoverage: {
        totalTopics: 0,
        coveredTopics: 0,
        coveragePercentage: 0,
        byCategory: {},
      },

      // Category Health
      categoryHealth: {
        technology: { health: 100, articles: 0, quality: 0 },
        finance: { health: 100, articles: 0, quality: 0 },
        travel: { health: 100, articles: 0, quality: 0 },
        health: { health: 100, articles: 0, quality: 0 },
        home: { health: 100, articles: 0, quality: 0 },
        business: { health: 100, articles: 0, quality: 0 },
        education: { health: 100, articles: 0, quality: 0 },
      },

      // Revenue
      revenue: {
        totalRevenue: 0,
        revenueByCategory: {},
        revenueBySource: {
          affiliate: 0,
          ads: 0,
          products: 0,
        },
        revenueTrend: "stable",
        revenueGrowth: 0,
      },

      // Traffic
      traffic: {
        pageViews: 0,
        uniqueVisitors: 0,
        organicTraffic: 0,
        socialTraffic: 0,
        directTraffic: 0,
        bounceRate: 0,
        avgTimeOnPage: 0,
      },

      // Quality
      quality: {
        averageQualityScore: 0,
        articlesAboveThreshold: 0,
        articlesBelowThreshold: 0,
        overallQuality: "good",
      },

      // Production
      production: {
        livePages: 0,
        inProduction: 0,
        productionErrors: 0,
        productionHealth: "healthy",
      },

      // AI Workforce
      aiWorkforce: {
        totalAgents: registryStats.totalAgents,
        healthyAgents: registryStats.byStatus["idle"] || 0,
        activeAgents: registryStats.byStatus["running"] || 0,
        degradedAgents: 0,
        failingAgents: 0,
        agents: Array.from(registry.getAllAgents().values()).map(a => ({
          id: a.agent.id,
          name: a.agent.name,
          status: a.agent.status,
          executionCount: a.agent.executionCount,
          successRate: a.agent.successRate,
        })),
      },

      // Queue
      queue: {
        totalTasks: queueStats.totalTasks,
        pendingTasks: queueStats.byStatus["pending"] || 0,
        inProgressTasks: queueStats.byStatus["in-progress"] || 0,
        completedTasks: queueStats.byStatus["completed"] || 0,
        failedTasks: queueStats.byStatus["failed"] || 0,
        completionRate: queueStats.completionRate,
      },

      // Growth
      growth: {
        newTopics: 0,
        competitorGaps: 0,
        keywordGaps: 0,
        trendingTopics: 0,
        authorityScore: 0,
      },

      // Monetization
      monetization: {
        affiliateLinks: 0,
        affiliateRevenue: 0,
        adRevenue: 0,
        productRevenue: 0,
        conversionRate: 0,
      },

      // Distribution
      distribution: {
        socialPosts: 0,
        newsletterSubscribers: 0,
        newsletterSent: 0,
        indexedPages: 0,
        sitemapGenerated: true,
      },

      // Analytics
      analytics: {
        searchConsole: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          avgPosition: 0,
        },
        internalSearch: {
          totalSearches: 0,
          zeroResults: 0,
        },
      },

      // Experiments
      experiments: {
        activeTests: 0,
        completedTests: 0,
        winnersImplemented: 0,
        averageImprovement: 0,
      },

      // Policies
      policies: {
        activePolicies: 0,
        policyViolations: 0,
        policyCompliance: 100,
      },

      // Business Goals
      businessGoals: {
        monthlyRevenue: { target: 0, current: 0, progress: 0 },
        monthlyTraffic: { target: 0, current: 0, progress: 0 },
        contentProduction: { target: 0, current: 0, progress: 0 },
        qualityScore: { target: 85, current: 0, progress: 0 },
      },

      // Blueprint Compliance & Migration
      blueprint: blueprintMetrics,
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("CEO Dashboard error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
