package com.clearbook.api;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.SpecializationRepository;
import com.clearbook.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;

@SpringBootApplication
@EnableScheduling
public class ApiApplication {

    /** All 22 specializations: code → display name */
    private static final List<String[]> SPECIALIZATIONS = List.of(
            new String[]{"CARDIOLOGY",        "Cardiology"},
            new String[]{"NEUROLOGY",         "Neurology"},
            new String[]{"ORTHOPEDICS",       "Orthopedics"},
            new String[]{"PEDIATRICS",        "Pediatrics"},
            new String[]{"DERMATOLOGY",       "Dermatology"},
            new String[]{"GYNECOLOGY",        "Gynecology"},
            new String[]{"PSYCHIATRY",        "Psychiatry"},
            new String[]{"OPHTHALMOLOGY",     "Ophthalmology"},
            new String[]{"RADIOLOGY",         "Radiology"},
            new String[]{"ONCOLOGY",          "Oncology"},
            new String[]{"EMERGENCY_MEDICINE","Emergency Medicine"},
            new String[]{"INTERNAL_MEDICINE", "Internal Medicine"},
            new String[]{"SURGERY",           "Surgery"},
            new String[]{"UROLOGY",           "Urology"},
            new String[]{"ENDOCRINOLOGY",     "Endocrinology"},
            new String[]{"GASTROENTEROLOGY",  "Gastroenterology"},
            new String[]{"PULMONOLOGY",       "Pulmonology"},
            new String[]{"RHEUMATOLOGY",      "Rheumatology"},
            new String[]{"NEPHROLOGY",        "Nephrology"},
            new String[]{"HEMATOLOGY",        "Hematology"},
            new String[]{"ANESTHESIOLOGY",    "Anesthesiology"},
            new String[]{"FAMILY_MEDICINE",   "Family Medicine"}
    );

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

    @Bean
    CommandLineRunner run(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          SpecializationRepository specializationRepository,
                          DoctorProfileRepository profileRepository) {
        return args -> {
            // ── Users ──────────────────────────────────────────────────────────
            seedUser(userRepository, passwordEncoder,
                    "admin@clearbook.com",   "Admin123!",   "System", "Admin",  Role.ADMIN,  AccountStatus.ACTIVE);
            seedUser(userRepository, passwordEncoder,
                    "patient@clearbook.com", "Patient123!", "Jan",    "Kowalski", Role.USER, AccountStatus.ACTIVE);
            seedUser(userRepository, passwordEncoder,
                    "doctor@clearbook.com",  "Doctor123!",  "Anna",   "Nowak",  Role.DOCTOR, AccountStatus.ACTIVE);

            // ── Specializations ────────────────────────────────────────────────
            for (String[] spec : SPECIALIZATIONS) {
                if (!specializationRepository.existsByCode(spec[0])) {
                    specializationRepository.save(Specialization.builder()
                            .code(spec[0])
                            .name(spec[1])
                            .build());
                }
            }
            System.out.println("[Seed] Specializations ready: " + specializationRepository.count());

            // ── DoctorProfile for test doctor ──────────────────────────────────
            userRepository.findByEmail("doctor@clearbook.com").ifPresent(doctor -> {
                if (profileRepository.findByUser(doctor).isEmpty()) {
                    Set<Specialization> specs = Set.of(
                            specializationRepository.findByCode("CARDIOLOGY").orElseThrow(),
                            specializationRepository.findByCode("INTERNAL_MEDICINE").orElseThrow()
                    );
                    profileRepository.save(DoctorProfile.builder()
                            .user(doctor)
                            .publicId("anna-nowak-demo")
                            .specializations(specs)
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
