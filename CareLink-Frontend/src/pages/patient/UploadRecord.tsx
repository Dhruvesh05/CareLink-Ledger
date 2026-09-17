import DashboardLayout from "../../components/DashboardLayout";

function UploadRecord() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-blue-800">
        Upload Medical Record
      </h1>

      <p className="text-gray-500 mt-2">
        Upload new medical reports securely.
      </p>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <div className="mb-6">
          <label className="font-medium">Record Title</label>

          <input
            type="text"
            placeholder="Enter Record Title"
            className="w-full mt-2 border rounded-xl p-4"
          />
        </div>

        <div className="mb-6">
          <label className="font-medium">Hospital Name</label>

          <input
            type="text"
            placeholder="Enter Hospital Name"
            className="w-full mt-2 border rounded-xl p-4"
          />
        </div>

        <div className="mb-6">
          <label className="font-medium">Upload File</label>

          <input
            type="file"
            className="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <button
          className="bg-blue-700 text-white px-8 py-4 rounded-xl hover:bg-blue-800 transition"
        >
          Upload Record
        </button>

      </div>

    </DashboardLayout>
  );
}

export default UploadRecord;