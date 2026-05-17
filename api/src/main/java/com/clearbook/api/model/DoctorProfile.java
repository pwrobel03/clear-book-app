package com.clearbook.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode(of = "id")
// user i specializations wykluczone: user to lazy proxy, specializations to kolekcja encji
@ToString(exclude = {"user", "specializations"})
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

    @ManyToMany
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

    @Column(name = "license_file_path")
    private String licenseFilePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    private String photoUrl;

    /** Whether the profile is visible to patients in search results. */
    @Column(nullable = false)
    @Builder.Default
    private boolean isPublic = true;

    @Column(nullable = false, columnDefinition = "double precision default 0.0")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private Integer totalReviews = 0;

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
