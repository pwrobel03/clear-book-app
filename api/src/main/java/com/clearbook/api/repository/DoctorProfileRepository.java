package com.clearbook.api.repository;

import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.MembershipStatus;
import com.clearbook.api.model.Specialization;
import com.clearbook.api.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, UUID> {

    Optional<DoctorProfile> findByUser(User user);

    @EntityGraph(attributePaths = {"user"})
    Optional<DoctorProfile> findByPublicId(String publicId);

    boolean existsByPublicId(String publicId);

    /** All public profiles — no filter. */
    // Page<DoctorProfile> findByIsPublicTrue(Pageable pageable);
    @EntityGraph(attributePaths = {"user"})
    Page<DoctorProfile> findByIsPublicTrue(Pageable pageable);

    /**
     * Searches public doctor profiles by optional specialization and/or city.
     * City is matched against active center memberships.
     */
    @Query("""
        SELECT DISTINCT dp FROM DoctorProfile dp
        JOIN FETCH dp.user /* DODANE: dociąga użtykownika jednym zapytaniem */
        WHERE dp.isPublic = true
        AND (:specialization IS NULL OR :specialization MEMBER OF dp.specializations)
        AND (:city IS NULL OR :city = '' OR EXISTS (
            SELECT cm FROM CenterMembership cm
            JOIN cm.center c
            WHERE cm.user = dp.user
            AND cm.status = :active
            AND LOWER(c.city) LIKE LOWER(CONCAT('%', :city, '%'))
        ))
        """)
    Page<DoctorProfile> search(
            @Param("specialization") Specialization specialization,
            @Param("city") String city,
            @Param("active") MembershipStatus active,
            Pageable pageable
    );
}
