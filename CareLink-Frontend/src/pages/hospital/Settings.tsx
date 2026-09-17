import DashboardLayout from "../../components/DashboardLayout";

function Settings() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Settings
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <label className="flex gap-4 mb-5">
          <input type="checkbox" />
          Enable Notifications
        </label>

        <label className="flex gap-4 mb-5">
          <input type="checkbox" />
          Email Alerts
        </label>

        <button className="bg-red-700 text-white px-8 py-3 rounded-xl">
          Save Settings
        </button>

      </div>

    </DashboardLayout>
  );
}

export default Settings;