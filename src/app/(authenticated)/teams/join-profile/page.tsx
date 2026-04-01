import { redirect } from "next/navigation";

// このページは廃止されました（share_code フロー廃止）。設定ページへリダイレクトします。
export default function JoinProfilePage() {
  redirect("/settings");
}
