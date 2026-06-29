import { Card } from "@/components/ui/Card";

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      <Card>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}
