import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { createDepartment, getDepartments, updateDepartment, type HospitalDepartment } from "../../api/organization";
import { ContentPanel, EmptyState, ErrorState, PageHeader } from "../../components/ui";

function Departments() {
  const [departments, setDepartments] = useState<HospitalDepartment[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = () => getDepartments().then(setDepartments).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load departments"));
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await createDepartment(name);
      setName("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create department");
    }
  }

  return <DashboardLayout><div className="space-y-6"><PageHeader eyebrow="Hospital operations" title="Departments" description="Manage departments owned by your hospital." />
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    <ContentPanel title="Add department"><form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Department name" className="enterprise-input flex-1" /><button className="rounded-lg bg-[#0F8B78] px-4 py-2 text-sm font-bold text-white">Add department</button></form></ContentPanel>
    <ContentPanel title="Department directory" action={<div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search departments" className="enterprise-input" /><button onClick={() => void getDepartments().then((items) => setDepartments(items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))))} className="rounded-lg border border-[#E4E8EC] px-4 py-2 text-sm font-bold text-[#17212F]">Search</button></div>}>
      <div className="grid gap-3 sm:grid-cols-2">{departments.map((department) => <div key={department._id} className="rounded-xl border border-[#E4E8EC] p-4"><p className="font-bold text-[#17212F]">{department.name}</p><p className="mt-1 text-sm text-[#697586]">{department.description || "No description"}</p><button onClick={() => void updateDepartment(department._id, { active: !department.active }).then(load).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to update department"))} className="mt-4 text-sm font-bold text-[#0F8B78]">{department.active ? "Deactivate" : "Reactivate"}</button></div>)}{departments.length === 0 && <EmptyState title="No departments found" />}</div>
    </ContentPanel>
  </div></DashboardLayout>;
}

export default Departments;
