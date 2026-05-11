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

    // Spring Data JPA
    // @EntityGraph zapobiega problemowi N+1 (robi JOIN FETCH dla pola "center")
    @EntityGraph(attributePaths = {"center"})
    List<CenterMembership> findByUserAndStatusAndCenter_Status(
            User user,
            MembershipStatus membershipStatus,
            CenterStatus centerStatus
    );
    boolean existsByUserAndCenter(User user, MedicalCenter center);
}
