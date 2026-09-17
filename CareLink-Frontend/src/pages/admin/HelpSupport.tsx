import DashboardLayout from "../../components/DashboardLayout";

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
      <h1 className="text-3xl font-bold text-purple-700">
        Help & Support
      </h1>

      <p className="text-gray-500 mt-2">
        Find answers and get support for CareLink Ledger.
      </p>

      <div className="bg-white rounded-2xl shadow mt-8 p-8">

        <h2 className="text-2xl font-bold">
          Frequently Asked Questions
        </h2>

        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="border-b pb-5"
            >
              <h3 className="font-bold">
                {faq.question}
              </h3>

              <p className="text-gray-500 mt-2">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

      </div>

      <div className="bg-white rounded-2xl shadow mt-6 p-8">
        <h2 className="text-xl font-bold">
          Need More Help?
        </h2>

        <p className="text-gray-500 mt-2">
          Contact the CareLink Ledger technical support team.
        </p>

        <button className="mt-5 bg-purple-700 text-white px-6 py-3 rounded-xl hover:bg-purple-800">
          Contact Support
        </button>
      </div>
    </DashboardLayout>
  );
}

export default HelpSupport;