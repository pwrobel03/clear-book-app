package com.clearbook.api.exception;

/**
 * Thrown when a requested resource (user, center, token, etc.) does not exist.
 * Maps to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
