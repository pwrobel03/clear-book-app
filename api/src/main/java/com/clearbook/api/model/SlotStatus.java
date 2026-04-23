package com.clearbook.api.model;

public enum SlotStatus {
    AVAILABLE,
    RESERVED,  // temporary locked
    BOOKED,    // confirmed appointment
    CANCELLED  // dismissed by the doctor
}