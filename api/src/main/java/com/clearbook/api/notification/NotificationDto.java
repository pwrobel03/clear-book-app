package com.clearbook.api.notification;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationDto(UUID id, String title, String message, boolean isRead, LocalDateTime createdAt) {}