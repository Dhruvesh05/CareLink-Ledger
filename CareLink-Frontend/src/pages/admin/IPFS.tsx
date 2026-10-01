import { useState } from "react";

import { apiGet, ApiError } from "../../api/client";
import { getToken } from "../../api/auth";
import DashboardLayout from "../../components/DashboardLayout";

function IPFS() {
  const [cid, setCid] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkPinStatus = async () => {
    if (!cid.trim()) {
      setStatus("Enter a CID to check its pin status.");
      return;
    }
    setIsChecking(true);
    try {
      const response = await apiGet<{ cid: string; pinned: boolean }>(`/ipfs/pin/${encodeURIComponent(cid.trim())}`, getToken() ?? undefined);
      setStatus(`${response.cid}: ${response.pinned ? "pinned" : "not pinned"}`);
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : "Unable to check pin status.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        IPFS Storage
      </h1>

      <p className="text-gray-500 mt-2">
        Monitor decentralized medical record storage.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow">
        <label className="font-medium text-slate-700" htmlFor="ipfs-cid">Check CID pin status</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input id="ipfs-cid" value={cid} onChange={(event) => setCid(event.target.value)} placeholder="bafy..." className="flex-1 rounded-xl border border-slate-200 p-3" />
          <button type="button" onClick={() => void checkPinStatus()} disabled={isChecking} className="rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{isChecking ? "Checking…" : "Check status"}</button>
        </div>
        {status && <p className="mt-3 text-sm text-slate-600">{status}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Storage Status
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-3">
            Backend status available per CID
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Stored Files
          </p>

          <h2 className="text-3xl font-bold mt-3">
            Not exposed
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">
            Storage Used
          </p>

          <h2 className="text-3xl font-bold mt-3">
            Not exposed
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