package com.clearbook.api.doctor;

import com.clearbook.api.doctor.dto.DoctorProfileRequest;
import com.clearbook.api.doctor.dto.DoctorProfileResponse;
import com.clearbook.api.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorProfileService profileService;

    /**
     * GET /api/doctors?specialization=CARDIOLOGY&city=Warsaw
     * Public search — no authentication required.
     */
    @GetMapping
    public ResponseEntity<Page<DoctorProfileResponse>> search(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(profileService.search(specialization, city, pageable));
    }

    /** GET /api/doctors/me/profile — own profile (authenticated doctor) */
    @GetMapping("/me/profile")
    public ResponseEntity<DoctorProfileResponse> getMyProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.getMyProfile(user));
    }

    /** PUT /api/doctors/me/profile — create or update profile */
    @PutMapping("/me/profile")
    public ResponseEntity<DoctorProfileResponse> upsertProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DoctorProfileRequest request) {
        return ResponseEntity.ok(profileService.createOrUpdate(user, request));
    }

    /** GET /api/doctors/{publicId} — public profile */
    @GetMapping("/{publicId}")
    public ResponseEntity<DoctorProfileResponse> getPublicProfile(
            @PathVariable String publicId,
            @AuthenticationPrincipal User user) { // DODANE
        return ResponseEntity.ok(profileService.getPublicProfile(publicId, user));
    }

    /** GET /api/doctors/{publicId}/centers — get affiliated centers */
    @GetMapping("/{publicId}/centers")
    public ResponseEntity<java.util.List<com.clearbook.api.center.dto.MedicalCenterResponse>> getAffiliatedCenters(
            @PathVariable String publicId) {
        return ResponseEntity.ok(profileService.getAffiliatedCenters(publicId));
    }
}
