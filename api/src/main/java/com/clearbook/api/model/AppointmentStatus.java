package com.clearbook.api.model;

public enum AppointmentStatus {
    SCHEDULED, // Scheduled and confirmed
    COMPLETED,
    CANCELLED, // Dismissed by the doctor/patient
    NO_SHOW    // Patient didn't show up
}