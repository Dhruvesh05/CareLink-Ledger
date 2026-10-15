import DashboardLayout from "../../components/DashboardLayout";

function Blockchain() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Blockchain
      </h1>

      <p className="text-gray-500 mt-2">
        Monitor blockchain transactions and network status.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Network Status
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-3">
            ● Connected
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Total Transactions
          </p>

          <h2 className="text-3xl font-bold mt-3">
            4,721
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Latest Block
          </p>

          <h2 className="text-3xl font-bold mt-3">
            #982341
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <h2 className="text-2xl font-bold">
          Blockchain Security
        </h2>

        <p className="text-gray-500 mt-3">
          Medical record hashes are securely stored on
          the blockchain to maintain data integrity.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default Blockchain;