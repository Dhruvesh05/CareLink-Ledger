import DashboardLayout from "../../components/DashboardLayout";
import { User } from "lucide-react";
import { ContentPanel, PageHeader } from "../../components/ui";

function Patients() {
  const patients = [
    {
      name: "Rahul Sharma",
      age: 32,
      bloodGroup: "B+",
      records: 8,
    },
    {
      name: "Sneha Joshi",
      age: 27,
      bloodGroup: "O+",
      records: 5,
    },
    {
      name: "Amit Patil",
      age: 41,
      bloodGroup: "A+",
      records: 12,
    },
    {
      name: "Neha Kulkarni",
      age: 29,
      bloodGroup: "AB+",
      records: 6,
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Patients" description="View registered patients and their medical record activity." />
      <ContentPanel><div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-[#697586]">
            <tr>
              <th className="p-3">Patient</th><th className="p-3">Age</th><th className="p-3">Blood Group</th><th className="p-3">Medical Records</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.name} className="border-b">
                <td className="p-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>{patient.name}</span>
                  </div>
                </td>

                <td className="p-3 text-slate-600">{patient.age}</td>

                <td className="p-3 text-slate-600">{patient.bloodGroup}</td>

                <td className="p-3 text-slate-600">
                  {patient.records} Records
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></ContentPanel>
    </DashboardLayout>
  );
}

export default Patients;