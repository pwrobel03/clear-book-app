package com.clearbook.api.specialization;

import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.Specialization;
import com.clearbook.api.repository.SpecializationRepository;
import com.clearbook.api.specialization.dto.SpecializationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpecializationService {

    private final SpecializationRepository repository;

    /** Returns all active specializations, sorted by name. */
    public List<SpecializationDto> findAll() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(SpecializationDto::from)
                .toList();
    }

    /** Admin — create a new specialization. */
    @Transactional
    public SpecializationDto create(String code, String name) {
        String normalizedCode = code.toUpperCase().replaceAll("[^A-Z0-9_]", "_");
        if (repository.existsByCode(normalizedCode)) {
            throw new ConflictException("Specialization with code '" + normalizedCode + "' already exists.");
        }
        Specialization spec = Specialization.builder()
                .code(normalizedCode)
                .name(name)
                .build();
        return SpecializationDto.from(repository.save(spec));
    }

    /** Admin — deactivate a specialization (soft delete). */
    @Transactional
    public void deactivate(UUID id) {
        Specialization spec = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialization not found."));
        spec.setActive(false);
        repository.save(spec);
    }
}
