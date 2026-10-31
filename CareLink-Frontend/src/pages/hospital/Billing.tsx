import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function Billing() {
  return (
    <DashboardLayout>

      <PageHeader eyebrow="Hospital operations" title="Billing" description="Create billing records for hospital services." />
      <ContentPanel title="Generate bill"><form className="space-y-4"><input type="text" placeholder="Patient Name" className="enterprise-input w-full" /><input type="number" placeholder="Amount" className="enterprise-input w-full" /><button type="submit" className="rounded-lg bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">Generate Bill</button></form></ContentPanel>

    </DashboardLayout>
  );
}

export default Billing;