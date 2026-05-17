package com.clearbook.api.review.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID appointmentId;
    private Integer rating;
    private String patientComment;
    private String doctorReply;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Dane do wyświetlenia (mogą być maskowane)
    private String patientDisplayName;
    private UUID doctorId;
    private String doctorFirstName;
    private String doctorLastName;
}