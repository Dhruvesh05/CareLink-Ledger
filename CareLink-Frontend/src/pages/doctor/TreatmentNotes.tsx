import DashboardLayout from "../../components/DashboardLayout";

function TreatmentNotes() {

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold text-green-700">
        Treatment Notes
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <textarea
          placeholder="Write Treatment Notes..."
          className="w-full border rounded-xl p-4 h-52"
        />

        <button className="mt-6 bg-green-700 text-white px-8 py-3 rounded-xl">
          Save Notes
        </button>

      </div>

    </DashboardLayout>

  );

}

export default TreatmentNotes;