package com.clearbook.api.specialization.dto;

import com.clearbook.api.model.Specialization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationDto {

    private UUID id;
    private String code;
    private String name;

    public static SpecializationDto from(Specialization s) {
        return SpecializationDto.builder()
                .id(s.getId())
                .code(s.getCode())
                .name(s.getName())
                .build();
    }
}
