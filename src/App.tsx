import { ToastProvider } from "@/components/Toast";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "@/lib/router";
import { OverviewPage } from "@/pages/OverviewPage";
import { TesterPage } from "@/pages/TesterPage";
import { PolicyPage } from "@/pages/PolicyPage";
import { ApprovalsPage } from "@/pages/ApprovalsPage";
import { AuditPage } from "@/pages/AuditPage";
import { DocsPage } from "@/pages/DocsPage";

function App() {
  const { route, navigate } = useRouter();

  return (
    <ToastProvider>
      <AppShell route={route} navigate={navigate}>
        {route === "overview" && <OverviewPage navigate={navigate} />}
        {route === "tester" && <TesterPage navigate={navigate} />}
        {route === "policy" && <PolicyPage />}
        {route === "approvals" && <ApprovalsPage />}
        {route === "audit" && <AuditPage />}
        {route === "docs" && <DocsPage />}
      </AppShell>
    </ToastProvider>
  );
}

export default App;
