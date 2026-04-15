package com.clearbook.api;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@SpringBootApplication
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

    @Bean
    CommandLineRunner run(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          DoctorProfileRepository profileRepository) {
        return args -> {
            seedUser(userRepository, passwordEncoder,
                    "admin@clearbook.com", "Admin123!", "System", "Admin",
                    Role.ADMIN, AccountStatus.ACTIVE);

            seedUser(userRepository, passwordEncoder,
                    "patient@clearbook.com", "Patient123!", "Jan", "Kowalski",
                    Role.USER, AccountStatus.ACTIVE);

            seedUser(userRepository, passwordEncoder,
                    "doctor@clearbook.com", "Doctor123!", "Anna", "Nowak",
                    Role.DOCTOR, AccountStatus.ACTIVE);

            // Seed DoctorProfile for the test doctor so they appear in /doctors listing
            userRepository.findByEmail("doctor@clearbook.com").ifPresent(doctor -> {
                if (profileRepository.findByUser(doctor).isEmpty()) {
                    profileRepository.save(DoctorProfile.builder()
                            .user(doctor)
                            .publicId("anna-nowak-demo")
                            .specializations(Set.of(
                                    Specialization.CARDIOLOGY,
                                    Specialization.INTERNAL_MEDICINE
                            ))
                            .bio("Experienced cardiologist with over 10 years of practice. " +
                                 "Specializing in cardiovascular disease prevention and treatment.")
                            .licenseNumber("PWZ-1234567")
                            .isPublic(true)
                            .build());
                    System.out.println("[Seed] Created DoctorProfile for: doctor@clearbook.com");
                }
            });
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
