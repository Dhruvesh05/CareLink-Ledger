import DashboardLayout from "../../components/DashboardLayout";

function Appointments() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Appointments
      </h1>

      <p className="text-gray-500 mt-2">
        View your upcoming and previous appointments.
      </p>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-4">Doctor</th>

              <th className="text-left">Hospital</th>

              <th className="text-left">Date</th>

              <th className="text-left">Time</th>

              <th className="text-left">Status</th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b">

              <td className="py-4">Dr. Sharma</td>

              <td>City Hospital</td>

              <td>10 Aug 2026</td>

              <td>10:30 AM</td>

              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Confirmed
                </span>
              </td>

            </tr>

            <tr>

              <td className="py-4">Dr. Mehta</td>

              <td>Apollo Hospital</td>

              <td>15 Aug 2026</td>

              <td>02:00 PM</td>

              <td>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  Pending
                </span>
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}

export default Appointments;