"use client";

import { toast } from "sonner";
import { CenterForm } from "@/components/centers/center-form";
import { updateCenterAction } from "@/lib/actions/centers";
import type { MedicalCenterResponse } from "@/types/api";
import type { CreateCenterData } from "@/lib/schemas/center";

export function CenterSettingsClient({
  center,
}: {
  center: MedicalCenterResponse;
}) {
  // Mapujemy odpowiedź z bazy na strukturę oczekiwaną przez formularz
  const initialData: CreateCenterData = {
    name: center.name,
    description: center.description || "",
    address: center.address,
    city: center.city,
    phone: center.phone || "",
    email: center.email || "",
    website: center.website || "",
    type: center.type as any,
  };

  async function handleUpdate(values: CreateCenterData) {
    const result = await updateCenterAction(center.id, values);

    if (result && "error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Center settings updated successfully.");
    }
  }

  return <CenterForm initialData={initialData} onSubmit={handleUpdate} />;
}
