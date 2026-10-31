import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../auth/AuthContext";
import { createInvoice, getInvoice, getInvoices, updateInvoice, type Invoice, type InvoiceStatus } from "../../api/operations";
import { ContentPanel, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../components/ui";

export default function Invoices() {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patientUserId, setPatientUserId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => getInvoices({ q: query, status: statusFilter || undefined }).then(setInvoices).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load invoices")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await createInvoice({ patientUserId, description, amountMinor: Math.round(Number(amount) * 100), appointmentId }); setPatientUserId(""); setDescription(""); setAmount(""); setAppointmentId(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to issue invoice"); }
  }
  async function mark(id: string, status: InvoiceStatus) {
    try { await updateInvoice(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to update invoice"); }
  }
  async function showDetails(id: string) {
    try { setSelected(await getInvoice(id)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load invoice details"); }
  }
  function printInvoice(invoice: Invoice) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setError("Allow pop-ups to print an invoice."); return; }
    printWindow.document.write(`<html><body><h1>${invoice.invoiceNumber}</h1><p>${invoice.description}</p><p>Amount: ${(invoice.amountMinor / 100).toFixed(2)} ${invoice.currency}</p><p>Status: ${invoice.status}</p></body></html>`);
    printWindow.document.close(); printWindow.print();
  }
  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Billing operations" title="Invoices" description="Billing records only; no payment gateway is implied or connected." />{error && <ErrorState message={error} />}
    {role === "Hospital" && <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-5 dark:border-white/10 dark:bg-zinc-950/70"><input value={patientUserId} onChange={(e) => setPatientUserId(e.target.value)} required placeholder="Patient user ID" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required placeholder="Hospital appointment ID" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="Amount" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white">Issue invoice</button></form>}
    <div className="flex flex-wrap gap-3"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} placeholder="Search invoices" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as InvoiceStatus | ""); void getInvoices({ q: query, status: e.target.value as InvoiceStatus }).then(setInvoices); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All statuses</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="void">Void</option></select><button onClick={() => void load()} className="rounded-xl border px-4 py-2 text-sm">Search</button></div>
    <ContentPanel title="Invoice history" className="overflow-x-auto">{loading ? <LoadingState label="Loading invoices…" /> : invoices.length === 0 ? <EmptyState title="No invoices found" /> : <table className="min-w-full text-left text-sm"><thead><tr><th className="p-4">Invoice</th><th className="p-4">Description</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice._id} className="border-t border-slate-100"><td className="p-4 font-mono">{invoice.invoiceNumber}</td><td className="p-4">{invoice.description}</td><td className="p-4">{(invoice.amountMinor / 100).toFixed(2)} {invoice.currency}</td><td className="p-4"><StatusBadge tone={invoice.status === "paid" ? "success" : invoice.status === "void" ? "danger" : "warning"}>{invoice.status}</StatusBadge></td><td className="p-4"><button onClick={() => void showDetails(invoice._id)} className="text-cyan-700">Details</button>{role === "Hospital" && invoice.status === "issued" && <><button onClick={() => void mark(invoice._id, "paid")} className="ml-3 text-emerald-700">Mark paid</button><button onClick={() => void mark(invoice._id, "void")} className="ml-3 text-rose-700">Void</button></>}</td></tr>)}</tbody></table>}</ContentPanel>
    {selected && <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-950/70"><div className="flex justify-between"><h2 className="font-bold">{selected.invoiceNumber}</h2><button onClick={() => printInvoice(selected)} className="text-cyan-700">Print / download</button></div><p className="mt-2 text-sm text-slate-500">{selected.description}</p><p className="mt-2 font-semibold">{(selected.amountMinor / 100).toFixed(2)} {selected.currency}</p></div>}
  </div></DashboardLayout>;
}
