import DashboardLayout from "../../components/DashboardLayout";

function Billing() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-red-700">
        Billing
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">

        <input
          type="text"
          placeholder="Patient Name"
          className="w-full border rounded-xl p-4 mb-4"
        />

        <input
          type="number"
          placeholder="Amount"
          className="w-full border rounded-xl p-4 mb-4"
        />

        <button className="bg-red-700 text-white px-8 py-3 rounded-xl">
          Generate Bill
        </button>

      </div>

    </DashboardLayout>
  );
}

export default Billing;