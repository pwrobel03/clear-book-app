package com.clearbook.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;   // null gdy konto czeka na aktywację (PENDING)
    private String role;
    private String status;
    private String message;
}
