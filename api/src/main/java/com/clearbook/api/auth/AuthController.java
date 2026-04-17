package com.clearbook.api.auth;

import com.clearbook.api.dto.AuthResponse;
import com.clearbook.api.dto.LoginRequest;
import com.clearbook.api.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        // Jeśli brak tokenu (konto PENDING) → 202 Accepted zamiast 200 OK
        HttpStatus status = response.getToken() == null ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}