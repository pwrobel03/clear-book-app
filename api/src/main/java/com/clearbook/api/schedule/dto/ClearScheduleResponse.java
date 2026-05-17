package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Summary returned after a bulk schedule clear operation.
 * Tells the doctor exactly what happened so they can inform patients if needed.
 */
@Data
@Builder
public class ClearScheduleResponse {
    private int blocksDeleted;
    private int appointmentsCancelled;
}
