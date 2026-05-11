package com.clearbook.api.review.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ReviewChangedEvent extends ApplicationEvent {
    private final UUID doctorId;

    public ReviewChangedEvent(Object source, UUID doctorId) {
        super(source);
        this.doctorId = doctorId;
    }
}