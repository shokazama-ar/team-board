import { Header } from "@/components/layout/header";
import { BottomNav, SideNav } from "@/components/layout/nav";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
