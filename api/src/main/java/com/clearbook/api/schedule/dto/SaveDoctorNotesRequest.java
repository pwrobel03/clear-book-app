package com.clearbook.api.schedule.dto;

import lombok.Data;

@Data
public class SaveDoctorNotesRequest {
    /** Doctor's internal notes about the appointment. May be blank to clear notes. */
    private String notes;
}
