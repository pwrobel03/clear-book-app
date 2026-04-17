package com.clearbook.api.dto;

import com.clearbook.api.model.MembershipRole;
import com.clearbook.api.model.Specialization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CenterMemberSummary {

    private String firstName;
    private String lastName;
    /** Null if the doctor has not completed their profile yet. */
    private String publicId;
    private Set<Specialization> specializations;
    private MembershipRole role;
}
