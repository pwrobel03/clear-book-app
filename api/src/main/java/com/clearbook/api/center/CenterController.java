package com.clearbook.api.center;

import com.clearbook.api.center.dto.*;
import com.clearbook.api.model.MembershipRole;
import com.clearbook.api.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/centers")
@RequiredArgsConstructor
public class CenterController {

    private final MedicalCenterService centerService;

    /** POST /api/centers — create center (any authenticated user becomes ADMIN) */
    @PostMapping
    public ResponseEntity<MedicalCenterResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateCenterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(centerService.create(user, request));
    }

    /** GET /api/centers/{id} — get center details */
    @GetMapping("/{id}")
    public ResponseEntity<MedicalCenterResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(centerService.findById(id));
    }

    /** GET /api/centers?city=Warsaw — list active centers */
    @GetMapping
    public ResponseEntity<Page<MedicalCenterResponse>> list(
            @RequestParam(required = false) String city,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(centerService.findActive(city, pageable));
    }

    /** GET /api/centers/{id}/members — active members of a center (public) */
    @GetMapping("/{id}/members")
    public ResponseEntity<List<CenterMemberSummary>> getCenterMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(centerService.getCenterMembers(id));
    }

    /** GET /api/centers/my — all memberships for the authenticated user */
    @GetMapping("/my")
    public ResponseEntity<List<MembershipResponse>> getMyMemberships(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(centerService.getMyMemberships(user));
    }

    /**
     * POST /api/centers/{id}/invite
     * Body: { "inviteCode": "CB-XXXX-XXXX", "role": "MEMBER" }
     */
    @PostMapping("/{id}/invite")
    public ResponseEntity<MembershipResponse> invite(
            @AuthenticationPrincipal User admin,
            @PathVariable UUID id,
            @Valid @RequestBody InviteCenterMemberRequest request) {
        return ResponseEntity.ok(centerService.inviteByCode(
                admin, id, request.getInviteCode(), request.getRole()
        ));
    }

    /** POST /api/centers/memberships/{membershipId}/accept */
    @PostMapping("/memberships/{membershipId}/accept")
    public ResponseEntity<MembershipResponse> accept(
            @AuthenticationPrincipal User user,
            @PathVariable UUID membershipId) {
        return ResponseEntity.ok(centerService.acceptInvitation(user, membershipId));
    }

    /** POST /api/centers/memberships/{membershipId}/reject */
    @PostMapping("/memberships/{membershipId}/reject")
    public ResponseEntity<Void> reject(
            @AuthenticationPrincipal User user,
            @PathVariable UUID membershipId) {
        centerService.rejectInvitation(user, membershipId);
        return ResponseEntity.noContent().build();
    }
}
