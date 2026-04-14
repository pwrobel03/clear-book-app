package com.clearbook.api;

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
            if (!userRepository.existsByEmail("admin@clearbook.com")) {
                User admin = User.builder()
                        .email("admin@clearbook.com")
                        .password(passwordEncoder.encode("tajne"))
                        .firstName("Super")
                        .lastName("Admin")
                        .role(Role.ADMIN)
                        .build();

                userRepository.save(admin);
                System.out.println("Utworzono pierwszego uzytkownika z zaszyfrowanym haslem!");
            }
        };
    }

}
