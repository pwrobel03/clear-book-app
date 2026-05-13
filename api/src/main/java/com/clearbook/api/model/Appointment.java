package com.clearbook.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"block", "patient", "service"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    // We link the appointment to the overall work block
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    private AvailabilityBlock block;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    // Which service was chosen?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private DoctorService service;

    // Exact times calculated during booking: e.g., 09:15 and 10:00 (for a 45min service)
    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    // Soft lock logic: If the status is RESERVED, it's valid only until this time
    private LocalDateTime reservedUntil;

    @Column(columnDefinition = "TEXT")
    private String patientNotes;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Helper method to extract the date part from the startTime for easier frontend rendering and grouping.
     */
    @Transient
    public LocalDate getDate() {
        if (this.startTime != null) {
            return this.startTime.toLocalDate();
        }
        return null;
    }

    /**
     * Helper method to return a nicely formatted date string (e.g., "25.12.2026") for frontend display.
     */
    @Transient
    public String getFormattedDate() {
        if (this.startTime != null) {
            return this.startTime.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        }
        return "";
    }

    /**
     * Helper method to return a nicely formatted time string (e.g., "14:30") for frontend display.
     */
    @Transient
    public String getFormattedTime() {
        if (this.startTime != null) {
            return this.startTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        }
        return "";
    }
}