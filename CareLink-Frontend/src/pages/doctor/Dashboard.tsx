import DashboardLayout from "../../components/DashboardLayout";

function Dashboard() {
  const stats = [
    { title: "Patient Requests", value: "24", icon: "👨‍⚕️", tone: "bg-blue-50 text-blue-700" },
    { title: "My Patients", value: "128", icon: "👥", tone: "bg-emerald-50 text-emerald-700" },
    { title: "Medical Records", value: "96", icon: "📁", tone: "bg-violet-50 text-violet-700" },
    { title: "Treatment Notes", value: "42", icon: "📝", tone: "bg-amber-50 text-amber-700" },
  ];

  const appointments = [
    { time: "09:00 AM", patient: "Sarah Johnson", type: "Follow-up", status: "Confirmed" },
    { time: "10:30 AM", patient: "Michael Chen", type: "Consultation", status: "In progress" },
    { time: "12:15 PM", patient: "Aisha Patel", type: "Diagnosis", status: "Pending" },
    { time: "03:00 PM", patient: "Daniel Lee", type: "Cardiology", status: "Confirmed" },
  ];

  const queue = [
    { name: "Emma Carter", condition: "Hypertension", tag: "High priority" },
    { name: "Oliver Smith", condition: "Diabetes", tag: "Review" },
    { name: "Sophia Brown", condition: "Post-op recovery", tag: "Monitoring" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 p-6 text-white shadow-[0_24px_55px_rgba(37,99,235,0.22)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-sky-100">Overview</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Doctor Dashboard</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-sky-50 backdrop-blur-sm">
              8 appointments today
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.10)]"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.tone}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold text-slate-500">This week</span>
              </div>
              <p className="mt-6 text-3xl font-bold text-slate-800">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Today&apos;s Schedule</h2>
              <button className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">View all</button>
            </div>

            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.time} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">⏰</div>
                    <div>
                      <p className="font-semibold text-slate-800">{appointment.patient}</p>
                      <p className="text-sm text-slate-500">{appointment.type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-slate-700">{appointment.time}</p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(14,116,144,0.06)]">
              <h2 className="text-xl font-bold text-slate-800">Priority Queue</h2>
              <div className="mt-5 space-y-4">
                {queue.map((patient) => (
                  <div key={patient.name} className="flex items-center justify-between rounded-2xl bg-sky-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{patient.name}</p>
                      <p className="text-sm text-slate-500">{patient.condition}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-sky-700 shadow-sm">
                      {patient.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-600 to-blue-700 p-6 text-white shadow-[0_20px_40px_rgba(59,130,246,0.18)]">
              <h2 className="text-xl font-bold">Care Summary</h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sky-100">Recovery rate</span>
                  <span className="text-lg font-bold">92%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sky-100">Follow-ups due</span>
                  <span className="text-lg font-bold">16</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sky-100">Critical alerts</span>
                  <span className="text-lg font-bold">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;