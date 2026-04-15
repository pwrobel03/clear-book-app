package com.clearbook.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Medical specialization stored in the database.
 * Replaces the previous Specialization enum — admin can now add new
 * specializations without code changes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "specializations")
public class Specialization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** URL-safe uppercase code, e.g. "CARDIOLOGY". Used as a stable identifier. */
    @Column(unique = true, nullable = false, length = 60)
    private String code;

    /** Human-readable display name, e.g. "Cardiology". */
    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
