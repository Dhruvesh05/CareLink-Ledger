import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function Settings() {

  return (

    <DashboardLayout>

      <PageHeader eyebrow="Preferences" title="Settings" description="Manage notifications and workspace preferences." />
      <ContentPanel title="Workspace preferences" className="max-w-2xl">

        <label className="flex gap-4 mb-5">
          <input type="checkbox"/>
          Email Notifications
        </label>

        <label className="flex gap-4 mb-5">
          <input type="checkbox"/>
          Dark Mode
        </label>

        <button className="bg-green-700 text-white px-8 py-3 rounded-xl">
          Save
        </button>

      </ContentPanel>

    </DashboardLayout>

  );

}

export default Settings;