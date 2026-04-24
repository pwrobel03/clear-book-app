package com.clearbook.api.repository;

import com.clearbook.api.model.DoctorService;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorServiceRepository extends JpaRepository<DoctorService, UUID> {

    /**
     * Fetches all active services defined by a specific doctor.
     * Used by the public-facing booking page.
     */
    List<DoctorService> findAllByDoctorAndActiveTrue(User doctor);

    /**
     * Fetches ALL services (including inactive) for the doctor's management panel.
     */
    List<DoctorService> findAllByDoctor(User doctor);

    List<DoctorService> findByDoctor(User doctor);

    List<DoctorService> findByDoctorAndActiveTrue(User doctor);
}