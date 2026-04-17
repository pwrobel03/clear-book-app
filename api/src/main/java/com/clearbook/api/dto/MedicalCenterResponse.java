package com.clearbook.api.dto;

import com.clearbook.api.model.CenterStatus;
import com.clearbook.api.model.CenterType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCenterResponse {

    private UUID id;
    private String name;
    private String description;
    private String address;
    private String city;
    private String phone;
    private String email;
    private String website;
    private String logoUrl;
    private CenterType type;
    private CenterStatus status;
    private LocalDateTime createdAt;
}
