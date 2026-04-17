package com.clearbook.api.repository;

import com.clearbook.api.model.AccountStatus;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndStatus(String email, AccountStatus status);

    boolean existsByEmail(String email);

    List<User> findByRoleAndStatus(Role role, AccountStatus status);

    Optional<User> findByEmail(String email);
}