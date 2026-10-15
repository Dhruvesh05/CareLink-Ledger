import DashboardLayout from "../../components/DashboardLayout";
import { Mail, Phone } from "lucide-react";

function HelpSupport() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-blue-800">Help & Support</h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <div className="space-y-5">
          <p className="flex items-center gap-2.5 text-slate-800 font-medium">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Email : support@carelink.com</span>
          </p>

          <p className="flex items-center gap-2.5 text-slate-800 font-medium">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Phone : +91 9876543210</span>
          </p>

          <textarea
            placeholder="Describe your issue..."
            className="w-full border rounded-xl p-4 h-40 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="bg-blue-700 hover:bg-blue-800 transition text-white font-semibold px-8 py-4 rounded-xl">
            Submit
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default HelpSupport;