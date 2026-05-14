package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Dry-run result for the preview-clear endpoint.
 * Shows how many blocks and appointments would be affected
 * without actually deleting or cancelling anything.
 */
@Data
@Builder
public class PreviewClearScheduleResponse {
    private int blocksAffected;
    private int appointmentsAffected;
}
