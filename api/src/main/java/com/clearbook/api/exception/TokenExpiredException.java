package com.clearbook.api.exception;

/**
 * Thrown when a time-limited token (email verification, password reset) has expired.
 * Maps to HTTP 400 Bad Request.
 */
public class TokenExpiredException extends RuntimeException {

    public TokenExpiredException(String message) {
        super(message);
    }
}
