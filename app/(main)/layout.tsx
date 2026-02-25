import { Sidebar } from "@/components/main/sidebar";
import { Topbar } from "@/components/main/topbar";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr] max-[980px]:grid-cols-1">
      <Sidebar />
      <main className="px-[14px] pb-[18px]">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
