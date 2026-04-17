package com.clearbook.api.dto;

import com.clearbook.api.model.CenterStatus;
import com.clearbook.api.model.MembershipRole;
import com.clearbook.api.model.MembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipResponse {

    private UUID id;
    private UUID centerId;
    private String centerName;
    private String centerCity;
    private MembershipRole role;
    private MembershipStatus status;
    private CenterStatus centerStatus;
    private LocalDateTime invitedAt;
    private LocalDateTime joinedAt;
}
