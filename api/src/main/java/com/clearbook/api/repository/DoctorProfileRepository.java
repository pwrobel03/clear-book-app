package com.clearbook.api.repository;

import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, UUID> {

    Optional<DoctorProfile> findByUser(User user);

    Optional<DoctorProfile> findByPublicId(String publicId);

    boolean existsByPublicId(String publicId);
}
