import { redirect } from "next/navigation";

// Root — redirect to /auth (middleware handles authenticated users → /dashboard)
export default function Home() {
  redirect("/auth");
}
