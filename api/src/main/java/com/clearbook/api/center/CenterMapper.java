package com.clearbook.api.center;

import com.clearbook.api.center.dto.MedicalCenterResponse;
import com.clearbook.api.model.MedicalCenter;
import org.springframework.stereotype.Component;

/**
 * Converts {@link MedicalCenter} entities to {@link MedicalCenterResponse} DTOs.
 *
 * <p>Centralizes the mapping logic shared between {@link MedicalCenterService}
 * and {@code AdminService}.</p>
 */
@Component
public class CenterMapper {

    public MedicalCenterResponse toResponse(MedicalCenter c) {
        return MedicalCenterResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .address(c.getAddress())
                .city(c.getCity())
                .phone(c.getPhone())
                .email(c.getEmail())
                .website(c.getWebsite())
                .logoUrl(c.getLogoUrl())
                .type(c.getType())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
