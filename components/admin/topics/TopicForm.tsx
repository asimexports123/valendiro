"use client";

import { CrudForm } from "@/components/admin/CrudForm";
import { FormField } from "@/components/admin/FormField";
import { Topic, TopicTranslation } from "@/lib/types";

interface TopicFormProps {
  topic?: Topic | null;
  translation?: TopicTranslation | null;
  action: (formData: FormData) => Promise<{ error: string | null }>;
  deleteAction?: () => Promise<{ error: string | null }>;
}

export function TopicForm({ topic, translation, action, deleteAction }: TopicFormProps) {
  return (
    <CrudForm
      action={action}
      deleteAction={deleteAction}
      backPath="/admin/topics"
      submitLabel={topic ? "Update Topic" : "Create Topic"}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label="Slug"
          name="slug"
          defaultValue={topic?.slug}
          required
          placeholder="unique-topic-slug"
        />
        <FormField
          label="Title (English)"
          name="title"
          defaultValue={translation?.title}
          required
          placeholder="Topic title"
        />
        <FormField
          label="Canonical Path"
          name="canonical_path"
          defaultValue={topic?.canonical_path}
          required
          placeholder="/en/topics/unique-topic-slug"
        />
        <FormField
          label="Status"
          name="status"
          type="select"
          defaultValue={topic?.status || "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "review", label: "Review" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <FormField
          label="Difficulty"
          name="difficulty"
          type="select"
          defaultValue={topic?.difficulty || ""}
          options={[
            { value: "", label: "None" },
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ]}
        />
        <FormField
          label="Read Time (minutes)"
          name="estimated_read_time"
          type="number"
          defaultValue={topic?.estimated_read_time ?? ""}
        />
        <FormField
          label="Subtitle"
          name="subtitle"
          defaultValue={translation?.subtitle || ""}
        />
        <FormField
          label="Meta Title"
          name="meta_title"
          defaultValue={translation?.meta_title || ""}
        />
        <FormField
          label="Meta Description"
          name="meta_description"
          defaultValue={translation?.meta_description || ""}
        />
        <FormField
          label="Published At"
          name="published_at"
          type="text"
          defaultValue={topic?.published_at ? new Date(topic.published_at).toISOString().slice(0, 16) : ""}
          placeholder="YYYY-MM-DDTHH:MM"
        />
      </div>
      <FormField
        label="Content"
        name="content"
        type="textarea"
        defaultValue={translation?.content || ""}
        rows={8}
      />
    </CrudForm>
  );
}
