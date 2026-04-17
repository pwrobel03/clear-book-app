package com.clearbook.api.repository;

import com.clearbook.api.model.InviteCode;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCode, UUID> {

    Optional<InviteCode> findByUser(User user);

    Optional<InviteCode> findByCode(String code);

    boolean existsByCode(String code);

    void deleteByUser(User user);
}
