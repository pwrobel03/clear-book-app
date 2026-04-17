package com.clearbook.api.center.dto;

import com.clearbook.api.model.MembershipRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CenterMemberSummary {
    private UUID membershipId; //
    private String firstName;
    private String lastName;
    /** Null if the doctor has not completed their profile yet. */
    private String publicId;
    /** Specialization codes */
    private Set<String> specializations;
    private MembershipRole role;
}
