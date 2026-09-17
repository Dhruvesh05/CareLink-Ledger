import DashboardLayout from "../../components/DashboardLayout";

function IPFS() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        IPFS Storage
      </h1>

      <p className="text-gray-500 mt-2">
        Monitor decentralized medical record storage.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Storage Status
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-3">
            ● Active
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Stored Files
          </p>

          <h2 className="text-3xl font-bold mt-3">
            5,842
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Storage Used
          </p>

          <h2 className="text-3xl font-bold mt-3">
            68 GB
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <h2 className="text-2xl font-bold">
          IPFS Overview
        </h2>

        <p className="text-gray-500 mt-3">
          Medical documents are stored using IPFS while
          their hashes are recorded on the blockchain.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default IPFS;