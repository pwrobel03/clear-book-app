package com.clearbook.api.model;

public enum AccountStatus {
    UNVERIFIED, // Oczekuje na potwierdzenie e-mail
    PENDING,  // Oczekuje na weryfikację (lekarz)
    ACTIVE,   // Aktywne konto
    BANNED,   // Zablokowane przez administratora
    DELETED
}