package com.clearbook.api.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MonthlyReportResponse {

    private int year;
    private int month;

    // ── Appointment counts ────────────────────────────────────────────────────
    private long totalAppointments;
    private long completed;
    private long scheduled;
    private long cancelled;
    private long noShow;

    // ── Financial ─────────────────────────────────────────────────────────────
    /** Sum of service prices for all COMPLETED appointments in this period. */
    private BigDecimal totalEarnings;

    // ── Top services (by completed count) ────────────────────────────────────
    private List<ServiceStat> topServices;

    // ── Per-center breakdown ──────────────────────────────────────────────────
    private List<CenterStat> perCenter;

    // ── Nested DTOs ───────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class ServiceStat {
        private String serviceName;
        private long count;
    }

    @Data
    @Builder
    public static class CenterStat {
        private String centerName;
        private long total;
        private long completed;
        private BigDecimal earnings;
    }
}
