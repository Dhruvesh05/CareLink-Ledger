import DashboardLayout from "../../components/DashboardLayout";

function Doctors() {
  const doctors = [
    {
      name: "Dr. Priya Patil",
      specialization: "Cardiologist",
      hospital: "City Care Hospital",
      status: "Verified",
    },
    {
      name: "Dr. Amit Sharma",
      specialization: "Neurologist",
      hospital: "Apollo Healthcare",
      status: "Verified",
    },
    {
      name: "Dr. Sneha Joshi",
      specialization: "Dermatologist",
      hospital: "LifeLine Hospital",
      status: "Pending",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Doctors
      </h1>

      <p className="text-gray-500 mt-2">
        Manage doctors and their verification status.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8 overflow-hidden">
        <table className="w-full">
          <thead className="bg-purple-50">
            <tr>
              <th className="text-left p-5">Doctor</th>
              <th className="text-left p-5">Specialization</th>
              <th className="text-left p-5">Hospital</th>
              <th className="text-left p-5">Status</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.name} className="border-t">
                <td className="p-5 font-medium">
                  👨‍⚕️ {doctor.name}
                </td>

                <td className="p-5">
                  {doctor.specialization}
                </td>

                <td className="p-5">
                  {doctor.hospital}
                </td>

                <td className="p-5">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                    {doctor.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Doctors;