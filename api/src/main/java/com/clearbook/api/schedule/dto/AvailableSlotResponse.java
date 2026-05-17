package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A virtual time slot available for booking.
 * These are NOT stored in the database — they are dynamically calculated
 * from the doctor's AvailabilityBlocks minus existing Appointments.
 *
 * The frontend renders these as clickable time buttons on the booking calendar.
 */
@Data
@Builder
public class AvailableSlotResponse {
    private UUID blockId;
    private UUID centerId;
    private String centerName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
