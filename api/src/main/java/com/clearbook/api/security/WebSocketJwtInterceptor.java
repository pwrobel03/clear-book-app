package com.clearbook.api.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketJwtInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            // On CONNECT: authenticate from the Authorization header and attach the principal
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String userEmail = jwtService.extractUsername(token);
                    if (userEmail != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                        if (jwtService.isTokenValid(token, userDetails)) {
                            accessor.setUser(new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()));
                            log.debug("WebSocket CONNECT authenticated for user: {}", userEmail);
                        } else {
                            log.warn("WebSocket CONNECT rejected — invalid token for user: {}", userEmail);
                        }
                    }
                } catch (Exception e) {
                    log.error("WebSocket CONNECT authentication failed: {}", e.getMessage());
                }
            }

        } else if (StompCommand.SUBSCRIBE.equals(command) || StompCommand.SEND.equals(command)) {
            // On SUBSCRIBE / SEND: verify the session principal is still authenticated.
            // This catches the case where a token expired after the initial handshake
            // (e.g. the user logged out and their account was disabled or tokens were revoked).
            java.security.Principal principal = accessor.getUser();
            if (principal instanceof UsernamePasswordAuthenticationToken auth) {
                if (auth.getPrincipal() instanceof UserDetails userDetails) {
                    try {
                        // Re-load from DB to pick up any account status changes (e.g. BANNED)
                        UserDetails fresh = userDetailsService.loadUserByUsername(userDetails.getUsername());
                        if (!fresh.isEnabled() || !fresh.isAccountNonLocked()) {
                            log.warn("WebSocket {} rejected — account disabled for user: {}",
                                    command, userDetails.getUsername());
                            return null; // Drop the message; Spring will close the connection
                        }
                    } catch (Exception e) {
                        log.error("WebSocket {} re-validation failed: {}", command, e.getMessage());
                        return null;
                    }
                }
            }
        }

        return message;
    }
}