import { z } from "zod";

export const doctorProfileSchema = z.object({
  specializations: z
    .array(z.string())
    .min(1, "Select at least one specialization"),
  bio: z.string().max(1000, "Bio must be under 1000 characters").optional(),
  licenseNumber: z.string().optional(),
  isPublic: z.boolean(),
});

export type DoctorProfileFormData = z.infer<typeof doctorProfileSchema>;

export type SpecOption = { code: string; name: string };