package com.clearbook.api.shared.dto;

/**
 * Generic single-field response used for confirmation messages across all domains.
 * Replaces raw JSON strings (e.g. "{\"message\": \"...\"}") in controllers.
 */
public record MessageResponse(String message) {}
