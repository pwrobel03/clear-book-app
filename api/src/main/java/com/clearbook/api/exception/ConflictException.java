package com.clearbook.api.exception;

/**
 * Thrown when an operation conflicts with the current state of a resource
 * (e.g. duplicate user, member already exists, invitation already processed).
 * Maps to HTTP 409 Conflict.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
