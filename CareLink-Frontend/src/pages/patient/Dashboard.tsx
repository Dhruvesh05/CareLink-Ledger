import { useEffect, useMemo, useState } from "react";

import { getPatientRecords, type MedicalRecordSummary } from "../../api/medicalRecords";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";

function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.walletAddress) {
      setRecords([]);
      return;
    }

    let isMounted = true;
    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const nextRecords = await getPatientRecords(user.walletAddress);
        if (isMounted) setRecords(nextRecords);
      } catch {
        if (isMounted) setRecords([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRecords();

    return () => {
      isMounted = false;
    };
  }, [user?.walletAddress]);

  const stats = useMemo(() => [
    { title: "Medical Records", value: String(records.length), icon: "📁", tone: "bg-blue-50 text-blue-700" },
    { title: "Appointments", value: "—", icon: "📅", tone: "bg-emerald-50 text-emerald-700" },
    { title: "Access Requests", value: "—", icon: "👥", tone: "bg-violet-50 text-violet-700" },
    { title: "Health Summary", value: records.some((record) => record.emergency) ? "High priority" : "Stable", icon: "❤️", tone: "bg-rose-50 text-rose-700" },
  ], [records]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((record) => {
      const category = record.category ?? "Other";
      map.set(category, (map.get(category) ?? 0) + 1);
    });
    return [...map.entries()].map(([label, count]) => ({ label, count: String(count) }));
  }, [records]);

  const recentRecords = records.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 p-6 text-white shadow-[0_24px_55px_rgba(37,99,235,0.22)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-sky-100">Overview</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Patient Dashboard</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-sky-50 backdrop-blur-sm">
              {isLoading ? "Loading records…" : `${records.length} medical records`}
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.10)]">
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.tone}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold text-slate-500">Live</span>
              </div>
              <p className="mt-6 text-3xl font-bold text-slate-800">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Recent Records</h2>
            </div>

            <div className="space-y-4">
              {recentRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No recent records yet. Upload a record to populate this view.</p>
              ) : (
                recentRecords.map((record) => (
                  <div key={record.recordId ?? record.id ?? record.cid ?? record.fileName ?? Math.random()} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{record.fileName ?? "Medical record"}</p>
                      <p className="text-sm text-slate-500">{record.category ?? "General"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{record.createdAt ?? record.timestamp ?? "Recent"}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${record.emergency ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {record.emergency ? "Emergency" : "Standard"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <h2 className="text-xl font-bold text-slate-800">My Records</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {categorySummary.length === 0 ? (
                <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-slate-500">No categories available yet.</div>
              ) : (
                categorySummary.map((record) => (
                  <div key={record.label} className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{record.label}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-700">{record.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;