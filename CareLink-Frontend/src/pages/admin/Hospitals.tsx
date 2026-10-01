import DashboardLayout from "../../components/DashboardLayout";

function Hospitals() {
  const hospitals = [
    {
      name: "City Care Hospital",
      location: "Nashik",
      doctors: 42,
      patients: 680,
      status: "Verified",
    },
    {
      name: "Apollo Healthcare",
      location: "Mumbai",
      doctors: 65,
      patients: 920,
      status: "Verified",
    },
    {
      name: "LifeLine Hospital",
      location: "Pune",
      doctors: 38,
      patients: 540,
      status: "Pending",
    },
    {
      name: "MediCare Hospital",
      location: "Nashik",
      doctors: 27,
      patients: 410,
      status: "Verified",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-purple-700">
              Hospitals
            </h1>

            <p className="text-gray-500 mt-2">
              Manage and monitor registered hospitals.
            </p>
          </div>

          <button className="bg-purple-700 text-white px-6 py-3 rounded-xl hover:bg-purple-800 transition">
            + Add Hospital
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">
              Total Hospitals
            </p>

            <h2 className="text-3xl font-bold text-purple-700 mt-2">
              82
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">
              Verified
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              74
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">
              Pending Verification
            </p>

            <h2 className="text-3xl font-bold text-orange-500 mt-2">
              8
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">
              Connected Hospitals
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              68
            </h2>
          </div>

        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow p-6">

          <input
            type="text"
            placeholder="Search hospitals by name or location..."
            className="w-full border border-gray-300 rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />

        </div>

        {/* Hospital Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Registered Hospitals
            </h2>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-purple-50">

                <tr>

                  <th className="text-left px-6 py-4">
                    Hospital Name
                  </th>

                  <th className="text-left px-6 py-4">
                    Location
                  </th>

                  <th className="text-left px-6 py-4">
                    Doctors
                  </th>

                  <th className="text-left px-6 py-4">
                    Patients
                  </th>

                  <th className="text-left px-6 py-4">
                    Status
                  </th>

                  <th className="text-left px-6 py-4">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {hospitals.map((hospital, index) => (

                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 font-medium">
                      {hospital.name}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {hospital.location}
                    </td>

                    <td className="px-6 py-4">
                      {hospital.doctors}
                    </td>

                    <td className="px-6 py-4">
                      {hospital.patients}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          hospital.status === "Verified"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {hospital.status}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <button className="text-purple-700 hover:underline mr-4">
                        View
                      </button>

                      <button className="text-red-500 hover:underline">
                        Remove
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Hospitals;