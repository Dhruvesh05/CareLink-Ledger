import DashboardLayout from "../../components/DashboardLayout";

function MedicalRecords() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Medical Records
      </h1>

      <p className="text-gray-500 mt-2">
        View and manage all your medical records.
      </p>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-4">Record ID</th>

              <th className="text-left">Hospital</th>

              <th className="text-left">Doctor</th>

              <th className="text-left">Date</th>

              <th className="text-left">Status</th>

              <th className="text-left">Action</th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b">

              <td className="py-4">REC001</td>

              <td>City Hospital</td>

              <td>Dr. Sharma</td>

              <td>05 Aug 2026</td>

              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Verified
                </span>
              </td>

              <td>
                <button className="bg-blue-700 text-white px-4 py-2 rounded-lg">
                  View
                </button>
              </td>

            </tr>

            <tr className="border-b">

              <td className="py-4">REC002</td>

              <td>Apollo Hospital</td>

              <td>Dr. Mehta</td>

              <td>20 Jul 2026</td>

              <td>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  Pending
                </span>
              </td>

              <td>
                <button className="bg-blue-700 text-white px-4 py-2 rounded-lg">
                  View
                </button>
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}

export default MedicalRecords;