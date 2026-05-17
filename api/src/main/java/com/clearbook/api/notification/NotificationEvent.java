package com.clearbook.api.notification;

import com.clearbook.api.model.User;

public record NotificationEvent(User user, String title, String message) {}