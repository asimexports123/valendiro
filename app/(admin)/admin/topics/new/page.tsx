import { redirect } from "next/navigation";
import { TopicForm } from "@/components/admin/topics/TopicForm";
import { createItem } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { Topic } from "@/lib/types";

export default function NewTopicPage() {
  async function createTopic(formData: FormData) {
    "use server";
    const slug = formData.get("slug") as string;
    const canonicalPath = (formData.get("canonical_path") as string) || `/en/topics/${slug}`;

    const topicPayload = {
      slug,
      canonical_path: canonicalPath,
      difficulty: formData.get("difficulty") as string || null,
      estimated_read_time: formData.get("estimated_read_time")
        ? parseInt(formData.get("estimated_read_time") as string, 10)
        : null,
      status: formData.get("status") as string,
      published_at: formData.get("published_at") as string || null,
    };

    const { data: topicRaw, error } = await createItem(
      { table: "topics", revalidatePaths: ["/admin/topics"] },
      topicPayload
    );

    if (error || !topicRaw) {
      return { error: error || "Failed to create topic" };
    }

    const topic = topicRaw as Topic;
    const supabase = await createClient();
    const { error: translationError } = await supabase.from("topic_translations").insert({
      topic_id: topic.id,
      language_code: DEFAULT_LANGUAGE,
      title: formData.get("title") as string,
      subtitle: (formData.get("subtitle") as string) || null,
      content: (formData.get("content") as string) || null,
      meta_title: (formData.get("meta_title") as string) || null,
      meta_description: (formData.get("meta_description") as string) || null,
    });

    if (translationError) {
      return { error: translationError.message };
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
