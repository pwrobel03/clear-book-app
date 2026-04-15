package com.clearbook.api.repository;

import com.clearbook.api.model.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, UUID> {

    List<Specialization> findByActiveTrueOrderByNameAsc();

    Optional<Specialization> findByCode(String code);

    boolean existsByCode(String code);
}
