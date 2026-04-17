import { forbidden } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMyMembershipInCenterAction,
  getCenterByIdAction,
} from "@/lib/actions/centers";
import { CenterSettingsClient } from "./settings-client";
import { log } from "node:console";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CenterDashboardPage({ params }: Props) {
  // W Next.js 15 params jest Obietnicą (Promise)
  const { id } = await params;

  // Pobieramy równolegle dane o członkostwie użytkownika oraz dane samej placówki
  const [membershipResult, center] = await Promise.all([
    getMyMembershipInCenterAction(id),
    getCenterByIdAction(id),
  ]);

  log("Membership Result:", membershipResult);
  log("Center Data:", center);

  // Jeśli użytkownik nie należy do placówki (403) lub wystąpił błąd pobierania danych
  if (membershipResult.error || !membershipResult.data || !center) {
    forbidden();
  }

  const membership = membershipResult.data;
  const isCenterAdmin = membership.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader
        title={membership.centerName}
        description={`${membership.centerCity} • Twoja rola: ${membership.role === "ADMIN" ? "Administrator" : "Członek"}`}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4">
              <TabsTrigger value="appointments">Wizyty</TabsTrigger>
              <TabsTrigger value="staff">Personel</TabsTrigger>

              {/* Sekcje widoczne tylko dla administratora placówki */}
              {isCenterAdmin && (
                <>
                  <TabsTrigger value="invites">Zaproś</TabsTrigger>
                  <TabsTrigger value="settings">Ustawienia</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Zakładka: Wizyty */}
            <TabsContent value="appointments" className="space-y-4">
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  Moduł zarządzania wizytami dla tej placówki pojawi się
                  wkrótce.
                </p>
              </div>
            </TabsContent>

            {/* Zakładka: Lista personelu */}
            <TabsContent value="staff" className="space-y-4">
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  Lista lekarzy i personelu placówki pojawi się wkrótce.
                </p>
              </div>
            </TabsContent>

            {/* Zakładki administracyjne */}
            {isCenterAdmin && (
              <>
                <TabsContent value="invites">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">
                        Zapraszanie personelu
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Generuj kody zaproszeń dla lekarzy, aby mogli dołączyć
                        do Twojej placówki.
                      </p>
                    </div>
                    <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                      Moduł zaproszeń w przygotowaniu...
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">
                        Ustawienia placówki
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Edytuj dane publiczne, opis oraz dane kontaktowe
                        placówki.
                      </p>
                    </div>

                    {/* Komponent kliencki z formularzem edycji */}
                    <CenterSettingsClient center={center} />
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
