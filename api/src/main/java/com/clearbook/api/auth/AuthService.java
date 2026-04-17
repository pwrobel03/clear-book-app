package com.clearbook.api.auth;

import com.clearbook.api.dto.AuthResponse;
import com.clearbook.api.dto.LoginRequest;
import com.clearbook.api.dto.RegisterRequest;
import com.clearbook.api.model.AccountStatus;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Użytkownik z tym adresem e-mail już istnieje.");
        }

        // Nie pozwalamy rejestrować kont ADMIN przez publiczny endpoint
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Rejestracja konta administratora jest niedozwolona.");
        }

        // Lekarz → PENDING (wymaga weryfikacji), pacjent → ACTIVE od razu
        AccountStatus initialStatus = request.getRole() == Role.DOCTOR
                ? AccountStatus.PENDING
                : AccountStatus.ACTIVE;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .status(initialStatus)
                .build();

        userRepository.save(user);

        // Lekarz z PENDING nie dostaje tokenu — musi czekać na aktywację przez admina
        if (initialStatus == AccountStatus.PENDING) {
            return AuthResponse.builder()
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .message("Twoje konto oczekuje na weryfikację przez administratora.")
                    .build();
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // AuthenticationManager sprawdza hasło oraz wywołuje isEnabled() i isAccountNonLocked() z UserDetails
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // findByEmailAndStatus(ACTIVE) odrzuci konta PENDING, BANNED i DELETED
        User user = userRepository.findByEmailAndStatus(request.getEmail(), AccountStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Konto nie jest aktywne lub podane dane są nieprawidłowe."));

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}