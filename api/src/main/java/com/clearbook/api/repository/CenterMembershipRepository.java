package com.clearbook.api.repository;

import com.clearbook.api.model.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CenterMembershipRepository extends JpaRepository<CenterMembership, UUID> {

    List<CenterMembership> findByUser(User user);

    List<CenterMembership> findByUserAndStatus(User user, MembershipStatus status);

    List<CenterMembership> findByCenter(MedicalCenter center);

    List<CenterMembership> findByCenterAndStatus(MedicalCenter center, MembershipStatus status);

    Optional<CenterMembership> findByUserAndCenter(User user, MedicalCenter center);

    // @EntityGraph prevents N+1 by eagerly joining the "center" association
    @EntityGraph(attributePaths = {"center"})
    List<CenterMembership> findByUserAndStatusAndCenter_Status(
            User user,
            MembershipStatus membershipStatus,
            CenterStatus centerStatus
    );

    boolean existsByUserAndCenter(User user, MedicalCenter center);

    /**
     * Returns true if the doctor is an ACTIVE member of at least one center
     * where the requester holds an ACTIVE ADMIN role. Single subquery — no N+1.
     */
    @Query("""
            SELECT COUNT(dm) > 0 FROM CenterMembership dm
            WHERE dm.user = :doctor
              AND dm.status = com.clearbook.api.model.MembershipStatus.ACTIVE
              AND dm.center IN (
                  SELECT rm.center FROM CenterMembership rm
                  WHERE rm.user = :requester
                    AND rm.role = com.clearbook.api.model.MembershipRole.ADMIN
                    AND rm.status = com.clearbook.api.model.MembershipStatus.ACTIVE
              )
            """)
    boolean existsSharedActiveCenterWhereRequesterIsAdmin(
            @Param("doctor") User doctor,
            @Param("requester") User requester
    );
}
