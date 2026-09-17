import { CalendarApp } from "@/components/CalendarApp";
import { SignInCard } from "@/components/SignInCard";
import { getUser } from "@/lib/session";

export default async function Page({ searchParams }: PageProps<"/">) {
  const [user, params] = await Promise.all([getUser(), searchParams]);
  if (!user) return <SignInCard error={typeof params.error === "string" ? params.error : undefined} />;
  return <CalendarApp me={user} />;
}
