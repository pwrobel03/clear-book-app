import { z } from "zod";

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
    role: z.enum(["USER", "DOCTOR"], {
      required_error: "Please select an account type",
    }),
    document: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      data.role !== "DOCTOR" ||
      (data.document && (data.document as FileList).length > 0),
    {
      message: "Medical license or certification is required for doctors",
      path: ["document"],
    }
  );

export type RegisterFormData = z.infer<typeof registerSchema>;

// Reset password schema
export const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotFormData = z.infer<typeof forgotSchema>;

// Reset password schema
export const resetSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetFormData = z.infer<typeof resetSchema>;