// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN"
export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED"

export type CenterType =
  | "CLINIC"
  | "HOSPITAL"
  | "PRIVATE_PRACTICE"
  | "DIAGNOSTIC_CENTER"
  | "REHABILITATION_CENTER"

export type CenterStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED"
export type MembershipRole = "ADMIN" | "MEMBER"
export type MembershipStatus = "INVITED" | "ACTIVE" | "REJECTED"

export type VerificationAction = "APPROVE" | "REJECT"

// ─── Action utility types ─────────────────────────────────────────────────────

/** Use when the action returns a value on success. */
export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

/** Use when the action returns nothing on success (204 No Content). */
export type VoidResult =
  | { success: true; error?: never }
  | { success?: never; error: string }

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
}

export interface InviteCodeResponse {
  code: string
  expiresAt: string // ISO-8601
}

// ─── Medical Centers ──────────────────────────────────────────────────────────

export interface MedicalCenterResponse {
  id: string
  name: string
  type: CenterType
  address: string
  city: string
  phone: string
  email: string
  description: string | null
  status: CenterStatus
}

export interface MembershipResponse {
  id: string
  centerId: string
  centerName: string
  role: MembershipRole
  status: MembershipStatus
}

export interface CenterMemberSummary {
  userId: string
  firstName: string
  lastName: string
  role: MembershipRole
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface SpecializationDto {
  id: string
  code: string
  name: string
}

export interface DoctorProfileResponse {
  id: string
  publicId: string
  firstName: string
  lastName: string
  bio: string | null
  city: string | null
  specializations: SpecializationDto[]
  centers: MedicalCenterResponse[]
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface PendingDoctorResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string // ISO-8601
}
