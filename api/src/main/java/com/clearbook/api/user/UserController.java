package com.clearbook.api.user;

import com.clearbook.api.dto.InviteCodeResponse;
import com.clearbook.api.model.User;
import com.clearbook.api.service.InviteCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final InviteCodeService inviteCodeService;

    /**
     * GET /api/users/me/invite-code
     * Returns the authenticated user's invite code.
     * Auto-generates one if none exists or the previous has expired.
     */
    @GetMapping("/me/invite-code")
    public ResponseEntity<InviteCodeResponse> getInviteCode(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(inviteCodeService.getOrCreate(user));
    }

    /**
     * POST /api/users/me/invite-code/refresh
     * Invalidates the current code and issues a new one immediately.
     * Use this if the code has been shared unintentionally.
     */
    @PostMapping("/me/invite-code/refresh")
    public ResponseEntity<InviteCodeResponse> refreshInviteCode(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(inviteCodeService.refresh(user));
    }
}
