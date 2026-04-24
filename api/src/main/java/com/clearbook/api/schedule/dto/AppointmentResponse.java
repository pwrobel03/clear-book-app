package com.clearbook.api.schedule.dto;

import com.clearbook.api.model.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AppointmentResponse {
    private UUID id;
    private UUID blockId;
    private UUID patientId;
    private UUID serviceId;
    private String serviceName;
    private int serviceDurationMinutes;
    // Doctor info
    private String doctorFirstName;
    private String doctorLastName;
    private String doctorPublicId;
    // Center info
    private String centerName;
    private UUID centerId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private AppointmentStatus status;
    private LocalDateTime reservedUntil;
    private String patientNotes;
    private LocalDateTime createdAt;
}
