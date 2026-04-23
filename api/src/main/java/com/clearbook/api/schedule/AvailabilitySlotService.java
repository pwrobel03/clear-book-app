package com.clearbook.api.schedule;

import com.clearbook.api.doctor.dto.GenerateSlotsRequest;
import com.clearbook.api.model.AvailabilitySlot;
import com.clearbook.api.model.MedicalCenter;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.AvailabilitySlotRepository;
import com.clearbook.api.repository.MedicalCenterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilitySlotService {

    private final AvailabilitySlotRepository slotRepository;
    private final MedicalCenterRepository centerRepository;

    /**
     * Generates recurring availability slots for a doctor in a specific time range.
     * It slices the given time range into chunks of 'durationMinutes' and checks
     * for overlaps with existing slots.
     *
     * @param doctor  The doctor creating the schedule
     * @param request Payload containing start/end time, duration, and visit type
     * @return List of successfully generated and saved slots
     */
    @Transactional
    public List<AvailabilitySlot> generateSlots(User doctor, GenerateSlotsRequest request) {

        MedicalCenter center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found"));

        List<AvailabilitySlot> newSlots = new ArrayList<>();
        LocalDateTime currentStartTime = request.getStartTime();

        log.info("Generating '{}' slots of {} min for Dr. {} starting at {}",
                request.getVisitType(), request.getDurationMinutes(), doctor.getLastName(), currentStartTime);

        // Loop until the next slot would exceed the requested end time
        while (!currentStartTime.plusMinutes(request.getDurationMinutes()).isAfter(request.getEndTime())) {

            LocalDateTime currentEndTime = currentStartTime.plusMinutes(request.getDurationMinutes());

            // 1. Check if there's already an active slot in this exact timeframe
            boolean isOverlapping = slotRepository.existsOverlappingSlot(doctor, currentStartTime, currentEndTime);

            if (!isOverlapping) {
                // 2. Create the slot if the timeframe is clear
                AvailabilitySlot slot = AvailabilitySlot.builder()
                        .doctor(doctor)
                        .center(center)
                        .startTime(currentStartTime)
                        .endTime(currentEndTime)
                        .visitType(request.getVisitType())
                        // Note: status is set to AVAILABLE by default in the entity
                        .build();

                newSlots.add(slot);
            } else {
                log.warn("Skipping slot from {} to {} due to overlap.", currentStartTime, currentEndTime);
            }

            // 3. Move the cursor forward for the next iteration
            currentStartTime = currentEndTime;
        }

        // Save all generated slots in a single batch
        return slotRepository.saveAll(newSlots);
    }
}