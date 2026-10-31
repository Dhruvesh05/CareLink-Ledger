import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function Settings() {
  return (
    <DashboardLayout>

      <PageHeader eyebrow="Hospital administration" title="Settings" description="Configure hospital notification preferences." />
      <ContentPanel title="Notification preferences"><form className="space-y-5">
        <label className="flex gap-4 text-sm font-medium text-[#17212F]"><input type="checkbox" className="mt-1" />
          Enable Notifications
        </label>
        <label className="flex gap-4 text-sm font-medium text-[#17212F]"><input type="checkbox" className="mt-1" />
          Email Alerts
        </label>
        <button type="submit" className="rounded-lg bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">
          Save Settings
        </button>
      </form></ContentPanel>

    </DashboardLayout>
  );
}

export default Settings;