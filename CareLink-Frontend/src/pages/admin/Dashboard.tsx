import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Users", value: "5,432", icon: "👥", tone: "bg-blue-50 text-blue-700" },
    { title: "Hospitals", value: "156", icon: "🏥", tone: "bg-emerald-50 text-emerald-700" },
    { title: "Doctors", value: "923", icon: "👨‍⚕️", tone: "bg-violet-50 text-violet-700" },
    { title: "Verified", value: "4,892", icon: "✅", tone: "bg-amber-50 text-amber-700" },
  ];

  const quickLinks = [
    { title: "Users", path: "/admin/users", desc: "Manage all users" },
    { title: "Hospitals", path: "/admin/hospitals", desc: "Review institutions" },
    { title: "Doctors", path: "/admin/doctors", desc: "Verify providers" },
    { title: "Analytics", path: "/admin/analytics", desc: "View insights" },
  ];

  const activity = [
    { action: "New user registered", detail: "Identity verification completed", time: "Recently" },
    { action: "Hospital added", detail: "New healthcare organization registered", time: "2h ago" },
    { action: "Blockchain transaction recorded", detail: "Healthcare hash submitted", time: "Today" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 p-6 text-white shadow-[0_24px_55px_rgba(249,115,22,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-100">Control center</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Admin Dashboard</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-amber-50 backdrop-blur-sm">
              System healthy
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(251,146,60,0.10)]">
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

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Quick Access</h2>
              <button className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Manage</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => navigate(link.path)}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
                >
                  <p className="text-lg font-bold text-slate-800">{link.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{link.desc}</p>
                  <div className="mt-4 text-sm font-medium text-amber-700">View details →</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
            <div className="mt-5 space-y-4">
              {activity.map((item) => (
                <div key={item.action} className="rounded-2xl bg-amber-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.action}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;