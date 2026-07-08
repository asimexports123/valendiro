import Link from "next/link";

export interface TopicEntityLink {
  slug: string;
  name: string;
}

interface TopicEntitiesSectionProps {
  entities: TopicEntityLink[];
  lang: string;
  /** Omit section heading when parent provides one */
  inline?: boolean;
}

export function TopicEntitiesSection({ entities, lang, inline }: TopicEntitiesSectionProps) {
  if (entities.length === 0) return null;

  return (
    <section className={inline ? "" : "mb-20"}>
      {!inline && (
        <h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Key concepts</h2>
      )}
      <div className="flex flex-wrap gap-2">
        {entities.map((entity) => (
          <Link
            key={entity.slug}
            href={`/${lang}/topics/${entity.slug}`}
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
          >
            {entity.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
