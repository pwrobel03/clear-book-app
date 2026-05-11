import { z } from "zod";

export const createCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  type: z.enum([
    "CLINIC",
    "HOSPITAL",
    "PRIVATE_PRACTICE",
    "DIAGNOSTIC_CENTER",
    "REHABILITATION_CENTER",
  ]),
});

export type CreateCenterData = z.infer<typeof createCenterSchema>;