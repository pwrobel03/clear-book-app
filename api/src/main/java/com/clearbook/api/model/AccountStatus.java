package com.clearbook.api.model;

public enum AccountStatus {
    PENDING,  // Oczekuje na weryfikację
    ACTIVE,   // Aktywne konto
    BANNED,   // Zablokowane przez administratora
    DELETED
}