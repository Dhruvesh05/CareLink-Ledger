import DashboardLayout from "../../components/DashboardLayout";
import { ContentPanel, EmptyState, PageHeader } from "../../components/ui";

function Notifications() {
  return (
    <DashboardLayout>
      <PageHeader title="Notifications" description="Stay updated with important system activities." />
      <ContentPanel><EmptyState title="Notifications unavailable" description="Notifications are not exposed by the current backend contract." /></ContentPanel>
    </DashboardLayout>
  );
}

export default Notifications;