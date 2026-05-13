package com.clearbook.api.notification;

import com.clearbook.api.model.User;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test/notify")
@RequiredArgsConstructor
public class TestNotificationController {

    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    @PostMapping
    @Transactional // Important to ensure the user is fetched in the same transaction as the event is published
    public ResponseEntity<String> sendTestNotification(@AuthenticationPrincipal UserDetails userDetails) {

        // Identify the current user based on the authentication principal
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Publish a test notification event for the current user
        eventPublisher.publishEvent(new NotificationEvent(
                currentUser,
                "🚀 System Test",
                "WeebSockets are working perfectly! This is a real-time message."
        ));

        return ResponseEntity.ok("Event published successfully!");
    }
}