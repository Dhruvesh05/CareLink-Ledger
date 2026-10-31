import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader, StatusBadge } from "../../components/ui";

function Appointments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Care coordination" title="Appointments" description="View your upcoming and previous appointments." />
        <ContentPanel title="Appointment history" subtitle="Appointments shared with your care team." className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200 text-sm">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Dr. Sharma</td>
                <td className="py-4 px-4">City Hospital</td>
                <td className="py-4 px-4">10 Aug 2026</td>
                <td className="py-4 px-4">10:30 AM</td>
                <td className="py-4 px-4">
                  <StatusBadge tone="success">Confirmed</StatusBadge>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Dr. Mehta</td>
                <td className="py-4 px-4">Apollo Hospital</td>
                <td className="py-4 px-4">15 Aug 2026</td>
                <td className="py-4 px-4">02:00 PM</td>
                <td className="py-4 px-4">
                  <StatusBadge tone="warning">Pending</StatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </ContentPanel>
      </div>
    </DashboardLayout>
  );
}

export default Appointments;