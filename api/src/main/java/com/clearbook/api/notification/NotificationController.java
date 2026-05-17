package com.clearbook.api.notification;

import com.clearbook.api.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Getting user's notifications with pagination
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 15) Pageable pageable) {
        return ResponseEntity.ok(notificationService.getUserHistory(user, pageable));
    }

    // Marking all notifications as read after user clicks the bell icon
    @PutMapping("/read")
    public ResponseEntity<Void> markAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.noContent().build();
    }
}