import DashboardLayout from "../../components/DashboardLayout";

function Settings() {

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold text-green-700">
        Settings
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

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

      </div>

    </DashboardLayout>

  );

}

export default Settings;