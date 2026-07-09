import { redirect } from "next/navigation";
import { TopicForm } from "@/components/admin/topics/TopicForm";
import { insertTopic, upsertTopicTranslation } from "@/services/publish/writers";
import { DEFAULT_LANGUAGE } from "@/lib/constants";

export default function NewTopicPage() {
  async function createTopic(formData: FormData) {
    "use server";
    const slug = formData.get("slug") as string;
    const canonicalPath = (formData.get("canonical_path") as string) || `/en/topics/${slug}`;

    try {
      const topicId = await insertTopic({
        slug,
        canonical_path: canonicalPath,
        difficulty: (formData.get("difficulty") as string) || undefined,
        estimated_read_time: formData.get("estimated_read_time")
          ? parseInt(formData.get("estimated_read_time") as string, 10)
          : undefined,
        status: (formData.get("status") as "draft" | "published" | "review" | "archived") || "draft",
        published_at: (formData.get("published_at") as string) || null,
      });

      await upsertTopicTranslation({
        topic_id: topicId,
        language_code: DEFAULT_LANGUAGE,
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        content: (formData.get("content") as string) || null,
        meta_title: (formData.get("meta_title") as string) || null,
        meta_description: (formData.get("meta_description") as string) || null,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create topic" };
    }

    return { error: null };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">New Topic</h1>
      <TopicForm action={createTopic} />
    </div>
  );
}
