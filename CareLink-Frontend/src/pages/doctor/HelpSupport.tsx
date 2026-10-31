import DashboardLayout from "../../components/DashboardLayout";
import { Mail, Phone } from "lucide-react";
import { ContentPanel, PageHeader } from "../../components/ui";

function HelpSupport() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Clinical support" title="Help & support" description="Get assistance with doctor workflows, patient permissions, and ledger queries." />
        <ContentPanel title="Contact support">
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Mail className="w-5 h-5" />
                </div>
                <span>support@carelink.com</span>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Phone className="w-5 h-5" />
                </div>
                <span>+91 9876543210</span>
              </div>
            </div>

            <textarea
              placeholder="Describe your issue..."
              className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-4 h-40 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
            />

            <button className="bg-cyan-600 hover:bg-cyan-500 transition-all text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-cyan-600/20">
              Submit
            </button>
          </div>
        </ContentPanel>
      </div>
    </DashboardLayout>
  );
}

export default HelpSupport;