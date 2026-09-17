import DashboardLayout from "../../components/DashboardLayout";

function Analytics() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Analytics
      </h1>

      <p className="text-gray-500 mt-2">
        Monitor the overall CareLink Ledger ecosystem.
      </p>

      <div className="grid md:grid-cols-4 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Total Users</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            1,248
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Hospitals</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            48
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Doctors</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            326
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Records</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            5,842
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <h2 className="text-2xl font-bold">
          System Activity
        </h2>

        <div className="mt-6 space-y-5">
          <div className="flex justify-between">
            <span>Medical Records Uploaded</span>
            <span className="font-bold">2,840</span>
          </div>

          <div className="flex justify-between">
            <span>Access Requests</span>
            <span className="font-bold">1,256</span>
          </div>

          <div className="flex justify-between">
            <span>Blockchain Transactions</span>
            <span className="font-bold">4,721</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Analytics;