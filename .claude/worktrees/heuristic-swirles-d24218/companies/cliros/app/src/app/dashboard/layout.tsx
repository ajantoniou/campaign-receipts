import DashboardShell from "@/components/DashboardShell";
// Walkthrough video parked until dashboard reliably shows completed reports.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
