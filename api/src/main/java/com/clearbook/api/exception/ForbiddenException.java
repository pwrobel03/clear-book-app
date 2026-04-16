package com.clearbook.api.exception;

/**
 * Thrown when an authenticated user attempts an operation they are not permitted to perform
 * (e.g. non-admin trying to manage a center, account not yet verified).
 * Maps to HTTP 403 Forbidden.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
