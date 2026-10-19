import DashboardLayout from "../../components/DashboardLayout";
import { UserCheck } from "lucide-react";

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

      <p className="text-slate-500 mt-2">
        Manage doctors and their verification status.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8 overflow-hidden border border-slate-100">
        <table className="w-full">
          <thead className="bg-purple-50">
            <tr>
              <th className="text-left p-5 font-semibold text-purple-900">Doctor</th>
              <th className="text-left p-5 font-semibold text-purple-900">Specialization</th>
              <th className="text-left p-5 font-semibold text-purple-900">Hospital</th>
              <th className="text-left p-5 font-semibold text-purple-900">Status</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.name} className="border-t border-slate-100">
                <td className="p-5 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>{doctor.name}</span>
                  </div>
                </td>

                <td className="p-5 text-slate-600">
                  {doctor.specialization}
                </td>

                <td className="p-5 text-slate-600">
                  {doctor.hospital}
                </td>

                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doctor.status === "Verified" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
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