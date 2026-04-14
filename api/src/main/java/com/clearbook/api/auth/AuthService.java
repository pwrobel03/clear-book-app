package com.clearbook.api.auth;

import com.clearbook.api.dto.AuthResponse;
import com.clearbook.api.dto.LoginRequest;
import com.clearbook.api.dto.RegisterRequest;
import com.clearbook.api.model.AccountStatus;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.model.VerificationToken;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.repository.VerificationTokenRepository;
import com.clearbook.api.security.JwtService;
import com.clearbook.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Użytkownik z tym adresem e-mail już istnieje.");
        }

        // Nie pozwalamy rejestrować kont ADMIN przez publiczny endpoint
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Rejestracja konta administratora jest niedozwolona.");
        }

        // Każde nowe konto wymaga potwierdzenia e-mail
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .status(AccountStatus.UNVERIFIED)
                .build();

        userRepository.save(user);

        // Generowanie i zapis tokenu
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();

        tokenRepository.save(verificationToken);

        // Wysyłka wiadomości
        emailService.sendVerificationEmail(user.getEmail(), token);

        return AuthResponse.builder()
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .message("Na Twój adres e-mail wysłano link weryfikacyjny. Sprawdź skrzynkę pocztową.")
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Nieprawidłowy token weryfikacyjny."));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Link weryfikacyjny wygasł.");
        }

        User user = verificationToken.getUser();

        System.out.printf("User: %s%n", user);

        // Zmiana statusu w zależności od roli
        if (user.getRole() == Role.DOCTOR) {
            user.setStatus(AccountStatus.PENDING); // Lekarz idzie do kolejki administratora
        } else {
            user.setStatus(AccountStatus.ACTIVE); // Pacjent staje się w pełni aktywny
        }

        userRepository.save(user);
        tokenRepository.delete(verificationToken); // Token jest jednorazowy
    }

    public AuthResponse login(LoginRequest request) {
        // Sprawdzenie poprawności hasła (wyrzuci BadCredentialsException jeśli jest złe)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Szukamy użytkownika po prostu po e-mailu
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika."));

        // Precyzyjna weryfikacja statusów
        if (user.getStatus() == AccountStatus.UNVERIFIED) {
            throw new IllegalArgumentException("Musisz potwierdzić swój adres e-mail przed zalogowaniem.");
        }

        if (user.getStatus() == AccountStatus.PENDING) {
            // Zwracamy odpowiedź bez tokenu, frontend obsłuży status PENDING
            return AuthResponse.builder()
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .message("Twoje konto oczekuje na weryfikację przez administratora.")
                    .build();
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Twoje konto zostało zablokowane lub usunięte.");
        }

        // Konto jest ACTIVE, generujemy token
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}