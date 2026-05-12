package com.clearbook.api.notification;

import com.clearbook.api.model.Notification;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createAndSend(User user, String title, String message) {
        // Save in database
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .isRead(false)
                .build();

        notificationRepository.save(notification);

        // Mapping into DTO send to WebSocket
        NotificationDto dto = new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );

        // Send to WebSocket specific user (using email as the unique identifier)
        messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notifications",
                dto
        );
        log.info("Send websocket notification to: {}", user.getEmail());
    }

    public Page<NotificationDto> getUserHistory(User user, Pageable pageable) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(n -> new NotificationDto(n.getId(), n.getTitle(), n.getMessage(), n.isRead(), n.getCreatedAt()));
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user);
    }
}