import { CalendarLoader } from "@/components/CalendarLoader";
import { SignInCard } from "@/components/SignInCard";
import { syncUser } from "@/lib/session";

export default async function Page() {
  const user = await syncUser();
  if (!user || user === "denied") return <SignInCard denied={user === "denied"} />;
  return <CalendarLoader me={user} />;
}
