import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function Settings() {
  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Manage administrator and system settings." />
      <ContentPanel title="Account Settings" className="max-w-3xl">
        <div className="space-y-6">

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">
                Email Notifications
              </h3>

              <p className="text-sm text-gray-500">
                Receive important system notifications.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <h3 className="font-semibold">
                Security Alerts
              </h3>

              <p className="text-sm text-gray-500">
                Receive alerts about security activities.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold">
              Dashboard Theme
            </h3>

            <select className="mt-3 border rounded-xl p-3 w-full">
              <option>Default</option>
              <option>Light</option>
            </select>
          </div>
        </div>
        </ContentPanel>
    </DashboardLayout>
  );
}

export default Settings;