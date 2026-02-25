import { Sidebar } from "@/components/main/sidebar";
import { Topbar } from "@/components/main/topbar";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
