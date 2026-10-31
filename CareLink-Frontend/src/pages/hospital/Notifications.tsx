import DashboardLayout from "../../components/DashboardLayout";
import { Bell, Calendar } from "lucide-react";
import { ContentPanel, PageHeader } from "../../components/ui";

function Notifications() {
  return (
    <DashboardLayout>
      <PageHeader eyebrow="Hospital updates" title="Notifications" description="Recent operational events for your hospital." />
      <ContentPanel title="Recent notifications"><div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#E4E8EC] p-4 text-sm font-semibold text-[#17212F]">
          <Bell className="h-5 w-5 shrink-0 text-[#0F8B78]" />
          <span>New Patient Registered</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E4E8EC] p-4 text-sm font-semibold text-[#17212F]">
          <Calendar className="h-5 w-5 shrink-0 text-[#0F8B78]" />
          <span>New Appointment Booked</span>
        </div>
      </div></ContentPanel>
    </DashboardLayout>
  );
}

export default Notifications;