import DashboardLayout from "../../components/DashboardLayout";

function PatientRequests() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-green-700">
        Patient Requests
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="text-left py-4">Patient</th>
              <th>Request</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td className="py-4">Rahul Patil</td>
              <td>Access Medical Records</td>
              <td>Pending</td>

              <td>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
                  Approve
                </button>
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}

export default PatientRequests;