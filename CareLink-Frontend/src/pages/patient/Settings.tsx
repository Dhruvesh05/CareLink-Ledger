import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function Settings() {
  return (
    <DashboardLayout>

      <PageHeader eyebrow="Preferences" title="Settings" description="Manage notifications and workspace preferences." />
      <ContentPanel title="Workspace preferences" className="max-w-2xl">

        <div className="space-y-6">

          <label className="flex items-center gap-4">
            <input type="checkbox" />
            Enable Notifications
          </label>

          <label className="flex items-center gap-4">
            <input type="checkbox" />
            Dark Mode
          </label>

          <label className="flex items-center gap-4">
            <input type="checkbox" />
            Auto Backup
          </label>

          <button className="bg-blue-700 text-white px-8 py-4 rounded-xl">
            Save Settings
          </button>

        </div>
      </ContentPanel>

    </DashboardLayout>
  );
}

export default Settings;