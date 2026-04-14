import { redirect } from "next/navigation";

// Strona główna — tymczasowo przekierowanie do /colors
// W kolejnych etapach: /login lub /dashboard (zależnie od ciasteczka)
export default function Home() {
  redirect("/colors");
}
