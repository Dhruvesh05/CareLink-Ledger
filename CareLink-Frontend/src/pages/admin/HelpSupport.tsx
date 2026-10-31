import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, PageHeader } from "../../components/ui";

function HelpSupport() {
  const faqs = [
    {
      question: "How does blockchain protect medical records?",
      answer:
        "Blockchain stores the record hash and helps maintain data integrity.",
    },
    {
      question: "How does IPFS store medical documents?",
      answer:
        "IPFS provides decentralized storage for medical documents.",
    },
    {
      question: "How can I verify a hospital?",
      answer:
        "Hospital verification can be performed by checking submitted registration and license information.",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Help & Support" description="Find answers and get technical support for CareLink Ledger." />
        <ContentPanel title="Frequently Asked Questions">

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border-b border-slate-100 dark:border-white/5 pb-5 last:border-0 last:pb-0"
              >
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {faq.question}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </ContentPanel>
        <ContentPanel title="Need More Help?" subtitle="Contact the CareLink Ledger technical support team.">

          <button className="rounded-xl bg-[#0F8B78] px-6 py-3 font-bold text-white">
            Contact Support
          </button>
        </ContentPanel>
      </div>
    </DashboardLayout>
  );
}

export default HelpSupport;