package com.clearbook.api.dto;

import com.clearbook.api.model.Specialization;
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
    private Set<Specialization> specializations;
    private String bio;
    private String licenseNumber;
    private String photoUrl;
    private boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
