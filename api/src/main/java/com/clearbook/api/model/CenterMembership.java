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
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode(of = "id")
// Lazy-loaded relacje wykluczone — zapobiegamy StackOverflowError i niechcianemu inicjowaniu proxy
@ToString(exclude = {"user", "center", "invitedBy"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "center_memberships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "center_id"})
)
public class CenterMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", nullable = false)
    private MedicalCenter center;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MembershipStatus status = MembershipStatus.INVITED;

    /** Who sent the invitation (center admin at the time). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id")
    private User invitedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime invitedAt;

    /** Set when the user accepts the invitation. */
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        invitedAt = LocalDateTime.now();
    }
}
