package com.clearbook.api.admin;

import com.clearbook.api.dto.MedicalCenterResponse;
import com.clearbook.api.dto.PendingDoctorResponse;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /** GET /api/admin/doctors/pending */
    @GetMapping("/doctors/pending")
    public ResponseEntity<List<PendingDoctorResponse>> getPendingDoctors(
            @AuthenticationPrincipal User user) {
        assertAdmin(user);
        return ResponseEntity.ok(adminService.getPendingDoctors());
    }

    /**
     * PATCH /api/admin/doctors/{id}/verify
     * Body: { "action": "approve" | "reject" }
     */
    @PatchMapping("/doctors/{id}/verify")
    public ResponseEntity<Void> verifyDoctor(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        assertAdmin(user);
        adminService.verifyDoctor(id, body.getOrDefault("action", ""));
        return ResponseEntity.noContent().build();
    }

    /** GET /api/admin/centers/pending */
    @GetMapping("/centers/pending")
    public ResponseEntity<List<MedicalCenterResponse>> getPendingCenters(
            @AuthenticationPrincipal User user) {
        assertAdmin(user);
        return ResponseEntity.ok(adminService.getPendingCenters());
    }

    /** PATCH /api/admin/centers/{id}/approve */
    @PatchMapping("/centers/{id}/approve")
    public ResponseEntity<MedicalCenterResponse> approveCenter(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        assertAdmin(user);
        return ResponseEntity.ok(adminService.approveCenter(id));
    }

    /** PATCH /api/admin/centers/{id}/reject */
    @PatchMapping("/centers/{id}/reject")
    public ResponseEntity<Void> rejectCenter(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        assertAdmin(user);
        adminService.rejectCenter(id);
        return ResponseEntity.noContent().build();
    }

    private void assertAdmin(User user) {
        if (user == null || user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Access denied.");
        }
    }
}
