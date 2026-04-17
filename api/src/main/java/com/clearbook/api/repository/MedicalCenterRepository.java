package com.clearbook.api.repository;

import com.clearbook.api.model.CenterStatus;
import com.clearbook.api.model.MedicalCenter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MedicalCenterRepository extends JpaRepository<MedicalCenter, UUID> {

    Page<MedicalCenter> findByStatus(CenterStatus status, Pageable pageable);

    Page<MedicalCenter> findByStatusAndCityIgnoreCase(CenterStatus status, String city, Pageable pageable);
}
