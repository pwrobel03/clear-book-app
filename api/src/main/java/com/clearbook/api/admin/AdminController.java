package com.clearbook.api.admin;

import com.clearbook.api.admin.dto.PendingDoctorResponse;
import com.clearbook.api.admin.dto.VerifyDoctorRequest;
import com.clearbook.api.center.dto.MedicalCenterResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/doctors/pending")
    public ResponseEntity<List<PendingDoctorResponse>> getPendingDoctors() {
        return ResponseEntity.ok(adminService.getPendingDoctors());
    }

    @PatchMapping("/doctors/{id}/verify")
    public ResponseEntity<Void> verifyDoctor(
            @PathVariable UUID id,
            @RequestBody @jakarta.validation.Valid VerifyDoctorRequest request) {
        adminService.verifyDoctor(id, request.getAction());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/centers/pending")
    public ResponseEntity<List<MedicalCenterResponse>> getPendingCenters() {
        return ResponseEntity.ok(adminService.getPendingCenters());
    }

    @PatchMapping("/centers/{id}/approve")
    public ResponseEntity<MedicalCenterResponse> approveCenter(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.approveCenter(id));
    }

    @PatchMapping("/centers/{id}/reject")
    public ResponseEntity<Void> rejectCenter(@PathVariable UUID id) {
        adminService.rejectCenter(id);
        return ResponseEntity.noContent().build();
    }
}
