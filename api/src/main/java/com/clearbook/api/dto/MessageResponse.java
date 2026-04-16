package com.clearbook.api.dto;

/**
 * Generic single-field response used for confirmation messages.
 * Replaces raw JSON strings (e.g. "{\"message\": \"...\"}") in controllers.
 */
public record MessageResponse(String message) {}
