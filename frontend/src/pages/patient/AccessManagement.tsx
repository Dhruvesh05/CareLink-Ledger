import DashboardLayout from "../../components/DashboardLayout";

function AccessManagement() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Access Management
      </h1>

      <p className="text-gray-500 mt-2">
        Grant or revoke access to your medical records.
      </p>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <table className="w-full">

          <thead>

            <tr className="border-b">
              <th className="text-left py-4">Doctor</th>
              <th className="text-left">Hospital</th>
              <th className="text-left">Permission</th>
              <th className="text-left">Action</th>
            </tr>

          </thead>

          <tbody>

            <tr>

              <td className="py-4">Dr. Sharma</td>
              <td>City Hospital</td>

              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Granted
                </span>
              </td>

              <td>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  Revoke
                </button>
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}

export default AccessManagement;