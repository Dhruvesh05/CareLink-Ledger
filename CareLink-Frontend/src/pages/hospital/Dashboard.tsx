import DashboardLayout from "../../components/DashboardLayout";

function Dashboard() {
  const stats = [
    { title: "Patients", value: "1,245", icon: "🏥", tone: "bg-blue-50 text-blue-700" },
    { title: "Doctors", value: "78", icon: "👨‍⚕️", tone: "bg-emerald-50 text-emerald-700" },
    { title: "Departments", value: "12", icon: "🏢", tone: "bg-violet-50 text-violet-700" },
    { title: "Appointments", value: "245", icon: "📅", tone: "bg-amber-50 text-amber-700" },
  ];

  const departmentStatus = [
    { name: "Cardiology", count: "128", tone: "bg-blue-50 text-blue-700" },
    { name: "Pediatrics", count: "94", tone: "bg-emerald-50 text-emerald-700" },
    { name: "Orthopedics", count: "76", tone: "bg-violet-50 text-violet-700" },
    { name: "Neurology", count: "58", tone: "bg-amber-50 text-amber-700" },
  ];

  const alerts = [
    { type: "Emergency", item: "ICU bed availability", status: "4 open" },
    { type: "Lab", item: "Test reports pending", status: "12 pending" },
    { type: "Surgery", item: "Operation schedule", status: "3 today" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 p-6 text-white shadow-[0_24px_55px_rgba(79,70,229,0.22)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-100">Operations</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Hospital Dashboard</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-violet-50 backdrop-blur-sm">
              24 active requests
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(99,102,241,0.10)]">
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.tone}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold text-slate-500">Today</span>
              </div>
              <p className="mt-6 text-3xl font-bold text-slate-800">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Department Status</h2>
              <button className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">View all</button>
            </div>

            <div className="space-y-4">
              {departmentStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <h2 className="text-xl font-bold text-slate-800">Operational Alerts</h2>
            <div className="mt-5 space-y-4">
              {alerts.map((alert) => (
                <div key={alert.item} className="rounded-2xl bg-violet-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-700">{alert.type}</span>
                    <span className="text-xs text-slate-500">{alert.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{alert.item}</p>
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