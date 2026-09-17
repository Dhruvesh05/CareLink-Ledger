import DashboardLayout from "../../components/DashboardLayout";

function HelpSupport() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Help & Support
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <p>📧 support@carelink.com</p>

        <p className="mt-3">☎ +91 9876543210</p>

        <textarea
          placeholder="Describe your issue..."
          className="w-full border rounded-xl p-4 h-40 mt-6"
        />

        <button className="bg-red-700 text-white px-8 py-3 rounded-xl mt-6">
          Submit
        </button>

      </div>

    </DashboardLayout>
  );
}

export default HelpSupport;