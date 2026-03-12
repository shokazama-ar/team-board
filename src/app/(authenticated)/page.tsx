import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "./_components/DashboardContent";
import DashboardSkeleton from "./_components/DashboardSkeleton";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user?.id ?? "")
    .single();

  const displayName = profile?.name || user?.email?.split("@")[0] || "ゲスト";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mt-4 md:mt-0 text-gray-600">
        ようこそ、
        <Link href="/settings" className="font-medium text-gray-900 hover:underline">
          {displayName}
        </Link>
        さん
      </p>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={user?.id ?? ""} />
      </Suspense>
    </div>
  );
}
