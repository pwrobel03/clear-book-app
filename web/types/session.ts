export type UserRole = "USER" | "DOCTOR" | "MANAGER" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING" | "BANNED" | "DELETED" | "UNVERIFIED";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}
