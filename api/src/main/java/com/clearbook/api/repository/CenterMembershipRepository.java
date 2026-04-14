package com.clearbook.api.repository;

import com.clearbook.api.model.CenterMembership;
import com.clearbook.api.model.MedicalCenter;
import com.clearbook.api.model.MembershipStatus;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
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

    boolean existsByUserAndCenter(User user, MedicalCenter center);
}
