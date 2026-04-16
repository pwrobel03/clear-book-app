package com.clearbook.api.dto;

import com.clearbook.api.model.MembershipRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteCenterMemberRequest {

    @NotBlank(message = "Invite code is required")
    private String inviteCode;

    @NotNull(message = "Role (MEMBER / ADMIN) is required")
    private MembershipRole role;
}