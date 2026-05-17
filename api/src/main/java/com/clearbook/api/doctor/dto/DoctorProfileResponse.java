package com.clearbook.api.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileResponse {

    private UUID id;
    private String publicId;
    private String firstName;
    private String lastName;
    private String email;
    /** Specialization codes, e.g. ["CARDIOLOGY", "NEUROLOGY"] */
    private Set<String> specializations;
    private String bio;
    private String licenseNumber;
    private String photoUrl;
    private boolean isPublic;
    private Double averageRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
