package com.clearbook.api.schedule;

import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.DoctorService;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.AppointmentRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.DoctorServiceRepository;
import com.clearbook.api.schedule.dto.CreateDoctorServiceRequest;
import com.clearbook.api.schedule.dto.DoctorServiceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Manages the catalogue of services offered by a doctor.
 *
 * Update strategy uses Copy-on-Write: if an existing service already has
 * booked appointments, the old record is soft-deleted and a new one is created
 * so that historical appointment data remains accurate.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorServiceManager {

    private final DoctorServiceRepository doctorServiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    // ── Public (no auth) ─────────────────────────────────────────────────────

    /**
     * Returns all active services offered by a doctor, identified by their public profile ID.
     */
    @Transactional(readOnly = true)
    public List<DoctorServiceResponse> getDoctorServices(String publicId) {
        DoctorProfile profile = doctorProfileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        return doctorServiceRepository.findAllByDoctorAndActiveTrue(profile.getUser())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Doctor-only ───────────────────────────────────────────────────────────

    /**
     * Returns all services for the authenticated doctor, including inactive ones
     * (needed to display historical appointment data correctly).
     */
    @Transactional(readOnly = true)
    public List<DoctorServiceResponse> getMyServices(User doctor) {
        return doctorServiceRepository.findByDoctor(doctor)
                .stream()
                .map(s -> DoctorServiceResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .durationMinutes(s.getDurationMinutes())
                        .price(s.getPrice())
                        .active(s.isActive())
                        .build())
                .toList();
    }

    /**
     * Creates a new service for the doctor. New services are active by default.
     */
    @Transactional
    public DoctorServiceResponse createService(User doctor, CreateDoctorServiceRequest request) {
        DoctorService service = DoctorService.builder()
                .doctor(doctor)
                .name(request.getName())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .active(true)
                .build();

        return toResponse(doctorServiceRepository.save(service));
    }

    /**
     * Updates a service.
     *
     * If the service already has booked appointments the old record is soft-deleted
     * and a new one is created (Copy-on-Write), preserving historical integrity.
     * Otherwise the existing record is updated in place.
     */
    @Transactional
    public DoctorServiceResponse updateService(User doctor, UUID serviceId,
                                               CreateDoctorServiceRequest request) {
        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to edit this service.");
        }

        if (appointmentRepository.existsByService(service)) {
            // Copy-on-Write: retire the old version, create a fresh one
            service.setActive(false);
            doctorServiceRepository.save(service);

            DoctorService newVersion = DoctorService.builder()
                    .doctor(doctor)
                    .name(request.getName())
                    .durationMinutes(request.getDurationMinutes())
                    .price(request.getPrice())
                    .active(true)
                    .build();

            log.info("Service {} had linked appointments — created new version via Copy-on-Write.", serviceId);
            return toResponse(doctorServiceRepository.save(newVersion));
        }

        service.setName(request.getName());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setPrice(request.getPrice());
        return toResponse(doctorServiceRepository.save(service));
    }

    /**
     * Soft-deletes a service (sets active = false).
     * Services with booked appointments are also deactivated instead of deleted
     * so that historical appointment records remain intact.
     */
    @Transactional
    public void deactivateService(User doctor, UUID serviceId) {
        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to deactivate this service.");
        }

        service.setActive(false);
        doctorServiceRepository.save(service);
        log.info("Doctor {} deactivated service {}.", doctor.getId(), serviceId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private DoctorServiceResponse toResponse(DoctorService s) {
        return DoctorServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .durationMinutes(s.getDurationMinutes())
                .price(s.getPrice())
                .active(s.isActive())
                .build();
    }
}
