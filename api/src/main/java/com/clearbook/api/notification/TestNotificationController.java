package com.clearbook.api.notification;

import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Development/ops helper — sends a test WebSocket notification to the caller.
 * Restricted to ADMIN role to prevent abuse in production.
 */
@RestController
@RequestMapping("/api/test/notify")
@RequiredArgsConstructor
public class TestNotificationController {

    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<String> sendTestNotification(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        eventPublisher.publishEvent(new NotificationEvent(
                currentUser,
                "🚀 System Test",
                "WebSockets are working perfectly! This is a real-time message."
        ));

        return ResponseEntity.ok("Event published successfully!");
    }
}
