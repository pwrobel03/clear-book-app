package com.clearbook.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data // Lombok: generuje gettery, settery, toString, equals i hashCode
@Builder // Lombok: ułatwia tworzenie obiektów (tzw. wzorzec Builder)
@NoArgsConstructor // Lombok: pusty konstruktor (wymagany przez Hibernate)
@AllArgsConstructor // Lombok: konstruktor ze wszystkimi polami
@Entity // Deklaracja tabeli
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING) // Zapisze w bazie słowo "ADMIN" a nie cyfrę np. "2"
    @Column(nullable = false)
    private Role role;

    // Status konta
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default // Domyślnie budujemy konta jako ACTIVE
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- METODY WYMAGANE PRZEZ INTERFEJS USERDETAILS ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Użytkownik nie jest zablokowany, jeśli jego status NIE JEST "BANNED"
        return status != AccountStatus.BANNED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Użytkownik jest aktywny, jeśli jego status nie to nie "DELETED"
        return status != AccountStatus.DELETED;
    }

    // Ta metoda uruchomi się sama ułamek sekundy przed pierwszym zapisem do bazy
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}