package com.clearbook.api.specialization;

import com.clearbook.api.dto.SpecializationDto;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.service.SpecializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/specializations")
@RequiredArgsConstructor
public class SpecializationController {

    private final SpecializationService service;

    /** GET /api/specializations — public, no auth required */
    @GetMapping
    public ResponseEntity<List<SpecializationDto>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    /**
     * POST /api/specializations
     * Body: { "code": "SPORTS_MEDICINE", "name": "Sports Medicine" }
     * Admin only.
     */
    @PostMapping
    public ResponseEntity<SpecializationDto> create(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        assertAdmin(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(body.get("code"), body.get("name")));
    }

    /** DELETE /api/specializations/{id} — soft-delete, admin only */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        assertAdmin(user);
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    private void assertAdmin(User user) {
        if (user == null || user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Access denied.");
        }
    }
}
