package com.clearbook.api.doctor;

import com.clearbook.api.dto.DoctorProfileRequest;
import com.clearbook.api.dto.DoctorProfileResponse;
import com.clearbook.api.model.User;
import com.clearbook.api.service.DoctorProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorProfileService profileService;

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

    /** GET /api/doctors/{publicId} — public profile (no auth required) */
    @GetMapping("/{publicId}")
    public ResponseEntity<DoctorProfileResponse> getPublicProfile(
            @PathVariable String publicId) {
        return ResponseEntity.ok(profileService.getPublicProfile(publicId));
    }

    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    public ResponseEntity<java.util.Map<String, String>> handleErrors(RuntimeException e) {
        return ResponseEntity.badRequest()
                .body(java.util.Map.of("message", e.getMessage()));
    }
}
