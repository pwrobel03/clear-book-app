package com.clearbook.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** One profile per doctor account. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    /**
     * URL-friendly public identifier used in doctor profile URLs.
     * Format: firstname-lastname-{shortId}, e.g. "anna-nowak-a3f2"
     */
    @Column(unique = true, nullable = false)
    private String publicId;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "doctor_profile_specializations",
            joinColumns = @JoinColumn(name = "doctor_profile_id"),
            inverseJoinColumns = @JoinColumn(name = "specialization_id")
    )
    @Builder.Default
    private Set<Specialization> specializations = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String licenseNumber;

    private String photoUrl;

    /** Whether the profile is visible to patients in search results. */
    @Column(nullable = false)
    @Builder.Default
    private boolean isPublic = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
