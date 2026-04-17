package com.clearbook.api.dto;

import com.clearbook.api.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "E-mail jest wymagany")
    @Email(message = "Nieprawidłowy format e-mail")
    private String email;

    @NotBlank(message = "Hasło jest wymagane")
    @Size(min = 6, message = "Hasło musi mieć co najmniej 6 znaków")
    private String password;

    @NotBlank(message = "Imię jest wymagane")
    private String firstName;

    @NotBlank(message = "Nazwisko jest wymagane")
    private String lastName;

    @NotNull(message = "Rola jest wymagana")
    private Role role;
}