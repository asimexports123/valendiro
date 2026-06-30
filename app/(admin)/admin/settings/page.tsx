import { getAutomationConfig } from "@/services/system/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const config = await getAutomationConfig();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control how your website operates automatically.</p>
      </div>
      <SettingsForm config={config} />
    </div>
  );
}
