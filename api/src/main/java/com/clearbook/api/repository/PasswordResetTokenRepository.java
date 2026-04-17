package com.clearbook.api.repository;

import com.clearbook.api.model.PasswordResetToken;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUser(User user); // Do czyszczenia starych tokenów
}