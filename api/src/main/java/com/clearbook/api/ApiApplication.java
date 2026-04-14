package com.clearbook.api;

import com.clearbook.api.model.AccountStatus;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiApplication.class, args);
	}

    @Bean
    CommandLineRunner run(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUser(userRepository, passwordEncoder,
                    "admin@clearbook.com",  "Admin123!", "System",  "Admin",  Role.ADMIN,   AccountStatus.ACTIVE);

            seedUser(userRepository, passwordEncoder,
                    "patient@clearbook.com", "Patient123!", "Jan",   "Kowalski", Role.USER, AccountStatus.ACTIVE);

            // Doctor is seeded as ACTIVE to allow immediate testing;
            // in production, doctors start as UNVERIFIED → PENDING until admin approval.
            seedUser(userRepository, passwordEncoder,
                    "doctor@clearbook.com",  "Doctor123!", "Anna",  "Nowak",  Role.DOCTOR,  AccountStatus.ACTIVE);
        };
    }

    private void seedUser(UserRepository repo, PasswordEncoder encoder,
                          String email, String password,
                          String firstName, String lastName,
                          Role role, AccountStatus status) {
        if (!repo.existsByEmail(email)) {
            repo.save(User.builder()
                    .email(email)
                    .password(encoder.encode(password))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(role)
                    .status(status)
                    .build());
            System.out.printf("[Seed] Created %s: %s%n", role, email);
        }
    }

}
