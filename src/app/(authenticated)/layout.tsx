import { Header } from "@/components/layout/header";
import { BottomNav, SideNav } from "@/components/layout/nav";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasTeam = false;
  if (user) {
    const { data } = await supabase
      .from("team_members")
      .select("id, member_profiles!inner(user_id)")
      .eq("member_profiles.user_id", user.id)
      .limit(1)
      .maybeSingle();
    hasTeam = !!data;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav hasTeam={hasTeam} />
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
      <BottomNav hasTeam={hasTeam} />
    </div>
  );
}
