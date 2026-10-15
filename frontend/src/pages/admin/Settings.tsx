import DashboardLayout from "../../components/DashboardLayout";

function Settings() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Settings
      </h1>

      <p className="text-gray-500 mt-2">
        Manage administrator and system settings.
      </p>

      <div className="bg-white rounded-2xl shadow p-8 mt-8 max-w-3xl">

        <h2 className="text-xl font-bold">
          Account Settings
        </h2>

        <div className="mt-6 space-y-6">

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

          <div className="border-t pt-6 flex justify-between items-center">
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

      </div>
    </DashboardLayout>
  );
}

export default Settings;