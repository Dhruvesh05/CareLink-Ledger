import DashboardLayout from "../../components/DashboardLayout";

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
      <h1 className="text-3xl font-bold text-purple-700">
        Patients
      </h1>

      <p className="text-gray-500 mt-2">
        View registered patients and their medical record activity.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8 overflow-hidden">
        <table className="w-full">
          <thead className="bg-purple-50">
            <tr>
              <th className="text-left p-5">Patient</th>
              <th className="text-left p-5">Age</th>
              <th className="text-left p-5">Blood Group</th>
              <th className="text-left p-5">Medical Records</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.name} className="border-t">
                <td className="p-5 font-medium">
                  👤 {patient.name}
                </td>

                <td className="p-5">{patient.age}</td>

                <td className="p-5">{patient.bloodGroup}</td>

                <td className="p-5">
                  {patient.records} Records
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Patients;