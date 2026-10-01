import { useEffect, useState } from "react";

import { getDoctorCount, getHospitalCount } from "../../api/admin";
import { getTotalRecords } from "../../api/medicalRecords";
import DashboardLayout from "../../components/DashboardLayout";

function Analytics() {
  const [counts, setCounts] = useState({ hospitals: 0, doctors: 0, records: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getHospitalCount(), getDoctorCount(), getTotalRecords()])
      .then(([hospitals, doctors, records]) => {
        if (mounted) setCounts({ hospitals, doctors, records });
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load analytics.");
      })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const value = (number: number) => isLoading ? "…" : String(number);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-purple-700">
        Analytics
      </h1>

      <p className="text-gray-500 mt-2">
        Monitor the overall CareLink Ledger ecosystem.
      </p>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid md:grid-cols-4 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Total Users</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            Not available
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Hospitals</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            {value(counts.hospitals)}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Doctors</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            {value(counts.doctors)}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500">Records</p>
          <h2 className="text-3xl font-bold text-purple-700 mt-3">
            {value(counts.records)}
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <h2 className="text-2xl font-bold">
          System Activity
        </h2>

        <div className="mt-6 space-y-5">
          <p className="text-sm text-slate-500">Detailed activity breakdown is not exposed by the current backend contract.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Analytics;