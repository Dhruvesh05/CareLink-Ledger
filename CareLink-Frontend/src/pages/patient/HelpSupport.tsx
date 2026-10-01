import DashboardLayout from "../../components/DashboardLayout";

function HelpSupport() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Help & Support
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <div className="space-y-5">

          <p>
            📧 Email : support@carelink.com
          </p>

          <p>
            ☎ Phone : +91 9876543210
          </p>

          <textarea
            placeholder="Describe your issue..."
            className="w-full border rounded-xl p-4 h-40"
          />

          <button className="bg-blue-700 text-white px-8 py-4 rounded-xl">
            Submit
          </button>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default HelpSupport;