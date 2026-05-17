-- ─────────────────────────────────────────────────────────────────────────────
-- V2 : Refresh token table
-- Supports HttpOnly-cookie-based token rotation with reuse detection.
-- ─────────────────────────────────────────────────────────────────────────────

create table refresh_tokens (
    id          uuid        not null,
    token       varchar(255) not null unique,
    user_id     uuid        not null,
    expires_at  timestamp(6) not null,
    created_at  timestamp(6) not null,
    revoked     boolean     not null default false,
    primary key (id)
);

alter table if exists refresh_tokens
    add constraint fk_refresh_token_user
    foreign key (user_id) references users;
