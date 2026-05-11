package com.clearbook.api.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI configuration.
 *
 * UI available at: http://localhost:8080/swagger-ui/index.html
 * JSON spec at:    http://localhost:8080/v3/api-docs
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title       = "ClearBook API",
                version     = "1.0",
                description = "REST API for the ClearBook medical appointment booking system. " +
                              "Endpoints require a valid JWT token in the Authorization header.",
                contact     = @Contact(name = "Piotr Wróbel")
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local development server")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name        = "bearerAuth",
        type        = SecuritySchemeType.HTTP,
        scheme      = "bearer",
        bearerFormat = "JWT",
        in          = SecuritySchemeIn.HEADER,
        description = "Paste your JWT token here, obtained from /api/auth/login"
)
public class OpenApiConfig {
    // Konfiguracja odbywa się wyłącznie przez adnotacje powyżej.
}
