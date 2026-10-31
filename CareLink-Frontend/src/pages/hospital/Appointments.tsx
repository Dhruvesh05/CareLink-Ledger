import DashboardLayout from "../../components/DashboardLayout";
import { Calendar } from "lucide-react";
import { ContentPanel, PageHeader } from "../../components/ui";

function Appointments() {
  return (
    <DashboardLayout>
      <PageHeader eyebrow="Hospital operations" title="Hospital Appointments" description="Review the appointment schedule for your hospital." />
      <ContentPanel title="Appointment schedule">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#17212F]">
        <Calendar className="h-5 w-5 text-[#0F8B78]" />
        <span>Appointment Schedule</span>
        </div>
      </ContentPanel>
    </DashboardLayout>
  );
}

export default Appointments;