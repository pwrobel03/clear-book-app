export interface ReviewResponse {
  id: string
  appointmentId: string
  rating: number
  patientComment: string
  doctorReply?: string
  repliedAt?: string
  createdAt: string
  patientDisplayName: string
  doctorId: string
  doctorFirstName: string
  doctorLastName: string
}

export interface ReviewItem {
  id: string;
  rating: number;
  patientComment: string;
  patientDisplayName: string;
  isAnonymous?: boolean;
  patientFirstName?: string;
  patientLastName?: string;
  createdAt: string;
  updatedAt?: string | null;
  doctorReply?: string | null;
  repliedAt?: string | null;
}
