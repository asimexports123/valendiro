import Link from "next/link";
import { KnowledgeGraph } from "@/components/public/KnowledgeGraph";
import { TopicTrustPanel, type TopicCitation, type TopicTrustMeta } from "@/components/public/TopicTrustPanel";
import { TopicEntitiesSection } from "@/components/public/TopicEntitiesSection";
import { QuickRecap } from "./QuickRecap";
import { LearningCheckpoint } from "./LearningCheckpoint";

interface SemanticRec {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  relationshipReason: string;
}

interface TopicLink {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
}

interface ConnectedTopicLink {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  connection?: string;
}

interface ArticleFooterProps {
  lang: string;
  topicTitle: string;
  citations: TopicCitation[];
  trust: TopicTrustMeta;
  entities: { slug: string; name: string }[];
  prerequisites: SemanticRec[];
  nextTopics: SemanticRec[];
  applications: SemanticRec[];
  connectedTopics: ConnectedTopicLink[];
  learningPath: { slug: string; title: string }[];
  sequentialNav: { previous?: TopicLink; next?: TopicLink } | null;
  recapPoints: string[];
  checkpoints: string[];
}

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-t border-border/40 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold tracking-tight text-foreground mb-6">{title}</h2>
      {children}
    </section>
  );
}

function TopicCard({ href, title, subtitle }: { href: string; title: string; subtitle?: string | null }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border/40 p-4 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all"
    >
      <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{title}</span>
      {subtitle && <span className="mt-1 text-xs text-muted-foreground line-clamp-2">{subtitle}</span>}
    </Link>
  );
}

export function ArticleFooter({
  lang,
  topicTitle,
  citations,
  trust,
  entities,
  prerequisites,
  nextTopics,
  applications,
  connectedTopics,
  learningPath,
  sequentialNav,
  recapPoints,
  checkpoints,
}: ArticleFooterProps) {
  const hasGraph =
    prerequisites.length > 0 || nextTopics.length > 0 || applications.length > 0;

  return (
    <footer className="mt-16 pt-4" aria-label="Article resources and next steps">
      {/* Quick recap & checkpoint */}
      {(recapPoints.length > 0 || checkpoints.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-4">
          {recapPoints.length > 0 && <QuickRecap points={recapPoints} />}
          {checkpoints.length > 0 && <LearningCheckpoint items={checkpoints} />}
        </div>
      )}

      {/* Learning path */}
      {hasGraph && (
        <FooterSection title="Learning path">
          <KnowledgeGraph
            prerequisites={prerequisites.map((r) => ({
              id: r.topicId,
              slug: r.topicSlug,
              title: r.topicTitle,
              relationship: r.relationshipReason,
            }))}
            currentTopic={{ title: topicTitle }}
            nextTopics={nextTopics.map((r) => ({
              id: r.topicId,
              slug: r.topicSlug,
              title: r.topicTitle,
              relationship: r.relationshipReason,
            }))}
            applications={applications.map((r) => ({
              id: r.topicId,
              slug: r.topicSlug,
              title: r.topicTitle,
              relationship: r.relationshipReason,
            }))}
            lang={lang}
          />
        </FooterSection>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <FooterSection title="Prerequisites">
          <div className="grid gap-3 sm:grid-cols-2">
            {prerequisites.map((rec) => (
              <TopicCard
                key={rec.topicId}
                href={`/${lang}/topics/${rec.topicSlug}`}
                title={rec.topicTitle}
                subtitle={rec.relationshipReason}
              />
            ))}
          </div>
        </FooterSection>
      )}

      {/* Next topics & roadmap */}
      {(nextTopics.length > 0 || learningPath.length > 0) && (
        <FooterSection title="Continue learning">
          <div className="space-y-2">
            {(learningPath.length > 0 ? learningPath : nextTopics.map((r) => ({ slug: r.topicSlug, title: r.topicTitle }))).map(
              (item, index) => (
                <Link
                  key={item.slug}
                  href={`/${lang}/topics/${item.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/40 p-4 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                </Link>
              )
            )}
          </div>
        </FooterSection>
      )}

      {/* Related topics — graph-connected only */}
      {connectedTopics.length > 0 && (
        <FooterSection title="Related topics">
          <div className="grid gap-3 sm:grid-cols-2">
            {connectedTopics.map((t) => (
              <Link
                key={t.id}
                href={`/${lang}/topics/${t.slug}`}
                className="group flex flex-col rounded-xl border border-border/40 p-4 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{t.title}</span>
                {t.connection && (
                  <span className="mt-1 text-xs text-muted-foreground">{t.connection}</span>
                )}
              </Link>
            ))}
          </div>
        </FooterSection>
      )}

      {/* Entities */}
      {entities.length > 0 && (
        <FooterSection title="Knowledge graph connections">
          <TopicEntitiesSection entities={entities} lang={lang} inline />
        </FooterSection>
      )}

      {/* Sources */}
      <FooterSection title="Referenced sources">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-6 sm:p-8">
          <TopicTrustPanel citations={citations} trust={trust} lang={lang} compact />
        </div>
      </FooterSection>

      {/* Prev / Next */}
      {sequentialNav && (sequentialNav.previous || sequentialNav.next) && (
        <div className="flex items-stretch gap-4 pt-10 border-t border-border/40">
          {sequentialNav.previous ? (
            <Link href={`/${lang}/topics/${sequentialNav.previous.slug}`} className="flex-1 group rounded-xl border border-border/40 p-5 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Previous</div>
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{sequentialNav.previous.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {sequentialNav.next ? (
            <Link href={`/${lang}/topics/${sequentialNav.next.slug}`} className="flex-1 group rounded-xl border border-border/40 p-5 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Next topic</div>
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{sequentialNav.next.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}
    </footer>
  );
}
