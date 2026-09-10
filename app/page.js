import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";
import Dashboard from "@/components/Dashboard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <SignInButton />;
  }

  return <Dashboard userEmail={session.user.email} />;
}
