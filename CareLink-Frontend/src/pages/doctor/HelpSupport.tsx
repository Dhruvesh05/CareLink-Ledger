import DashboardLayout from "../../components/DashboardLayout";
import { Mail, Phone } from "lucide-react";

function HelpSupport() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-green-700">Help & Support</h1>

      <div className="bg-white rounded-2xl shadow p-8 mt-8">
        <p className="flex items-center gap-2.5 text-slate-800 font-medium">
          <Mail className="w-5 h-5 text-green-600" />
          <span>support@carelink.com</span>
        </p>

        <p className="mt-3 flex items-center gap-2.5 text-slate-800 font-medium">
          <Phone className="w-5 h-5 text-green-600" />
          <span>+91 9876543210</span>
        </p>

        <textarea
          placeholder="Describe your issue..."
          className="w-full border rounded-xl p-4 h-40 mt-6 outline-none focus:ring-2 focus:ring-green-500"
        />

        <button className="bg-green-700 hover:bg-green-800 transition font-semibold text-white px-8 py-3 rounded-xl mt-6">
          Submit
        </button>
      </div>
    </DashboardLayout>
  );
}

export default HelpSupport;