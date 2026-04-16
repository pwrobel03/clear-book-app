package com.clearbook.api.auth.dto;

import com.clearbook.api.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "E-mail is required")
    @Email(message = "The email format is incorrect.")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password need at least 6 characters.")
    private String password;

    @NotBlank(message = "Name is required.")
    private String firstName;

    @NotBlank(message = "Surname is required.")
    private String lastName;

    @NotNull(message = "Role is required.")
    private Role role;
}
