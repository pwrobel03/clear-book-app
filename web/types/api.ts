// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "USER" | "DOCTOR" | "MANAGER" | "ADMIN";
export type AccountStatus = "UNVERIFIED" | "PENDING" | "ACTIVE" | "BANNED" | "DELETED"

export type CenterType =
  | "CLINIC"
  | "HOSPITAL"
  | "PRIVATE_PRACTICE"
  | "DIAGNOSTIC_CENTER"
  | "REHABILITATION_CENTER"

export type CenterStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED"
export type MembershipRole = "ADMIN" | "MEMBER"
export type MembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REJECTED"
export type VerificationAction = "APPROVE" | "REJECT"

// ─── Action utility types ─────────────────────────────────────────────────────

export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

export type VoidResult =
  | { success: true; error?: never }
  | { success?: never; error: string }

// ─── Auth & User ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string | null
  role: UserRole
  status: AccountStatus
  message: string | null
}

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: AccountStatus
}

export interface InviteCodeResponse {
  code: string
  expiresAt: string // ISO-8601
}

// ─── Medical Centers ──────────────────────────────────────────────────────────

export interface MedicalCenterResponse {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  type: CenterType
  status: CenterStatus
  createdAt: string
}

export interface CenterMemberSummary {
  membershipId: string
  firstName: string
  lastName: string
  publicId: string | null
  specializations: string[] // Kody specjalizacji np. ["CARDIOLOGY"]
  role: MembershipRole
}

export interface MembershipResponse {
  id: string
  centerId: string
  centerName: string
  centerCity: string
  role: MembershipRole
  status: MembershipStatus
  centerStatus: CenterStatus
  invitedAt: string
  joinedAt: string | null
}

// ─── Doctor & Specializations ─────────────────────────────────────────────────

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
  email: string
  specializations: string[] // Kody, np. ["CARDIOLOGY", "NEUROLOGY"]
  bio: string | null
  licenseNumber: string | null
  photoUrl: string | null
  public: boolean
  averageRating: number;
  totalReviews: number;
  createdAt: string
  updatedAt: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface PendingDoctorResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string // ISO-8601
  licenseFilePath?: string | null
}

/** @deprecated Use PendingDoctorResponse */
export type PendingDoctor = PendingDoctorResponse

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewResponse {
  id: string
  rating: number
  patientComment: string
  patientDisplayName: string
  isAnonymous?: boolean
  patientFirstName?: string
  patientLastName?: string
  createdAt: string
  updatedAt?: string | null
  doctorReply?: string | null
  repliedAt?: string | null
}

// ─── Pagination (Spring Data) ─────────────────────────────────────────────────
//
// Spring Data ≥ 3.3 / Spring Boot ≥ 4.0 changed Page<T> serialisation:
// pagination metadata was moved into a nested "page" sub-object.
//
// Old (< 3.3) — flat top-level fields:
//   { content: [...], totalPages: 5, totalElements: 100, number: 0, size: 20 }
//
// New (≥ 3.3) — metadata nested under "page":
//   { content: [...], page: { totalPages: 5, totalElements: 100, number: 0, size: 20 } }
//
// Both variants are represented here; use normalizeSpringPage() to get a
// consistently-shaped object regardless of which format the server returns.

export interface SpringPage<T> {
  content: T[]
  // Flat format (Spring Data < 3.3 / Spring Boot < 4.0)
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
  // Nested format (Spring Data ≥ 3.3 / Spring Boot ≥ 4.0)
  page?: {
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

/** Normalised view of a SpringPage — all fields guaranteed to be numbers. */
export interface NormalizedSpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}