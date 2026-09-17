import DashboardLayout from "../../components/DashboardLayout";

function Settings() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Settings
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

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

      </div>

    </DashboardLayout>
  );
}

export default Settings;