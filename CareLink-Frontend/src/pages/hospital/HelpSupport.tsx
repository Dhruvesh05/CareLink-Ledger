import DashboardLayout from "../../components/DashboardLayout";
import { Mail, Phone } from "lucide-react";
import { ContentPanel, PageHeader } from "../../components/ui";

function HelpSupport() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Hospital support" title="Help & Support" description="Get assistance with hospital operations, doctor credentials, and billing." />
        <ContentPanel title="Contact CareLink support">
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F4F0] text-[#0F8B78]">
                  <Mail className="w-5 h-5" />
                </div>
                <span>support@carelink.com</span>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F4F0] text-[#0F8B78]">
                  <Phone className="w-5 h-5" />
                </div>
                <span>+91 9876543210</span>
              </div>
            </div>

            <textarea
              placeholder="Describe your issue..."
              className="enterprise-input h-40 w-full"
            />

            <button className="rounded-lg bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">
              Submit
            </button>
          </div>
        </ContentPanel>
        </div>
    </DashboardLayout>
  );
}

export default HelpSupport;