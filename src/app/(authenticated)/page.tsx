import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "./_components/DashboardContent";
import DashboardSkeleton from "./_components/DashboardSkeleton";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <p className="text-gray-600">
        ようこそ、{user?.email ?? "ゲスト"}さん
      </p>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={user?.id ?? ""} />
      </Suspense>
    </div>
  );
}
