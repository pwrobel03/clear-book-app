package com.clearbook.api.report;

import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.model.User;
import com.clearbook.api.report.dto.MonthlyReportResponse;
import com.clearbook.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int TOP_SERVICES_LIMIT = 5;

    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public MonthlyReportResponse getMonthlyReport(User doctor, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime from = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime to = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        // ── Status breakdown ──────────────────────────────────────────────────
        List<Object[]> statusRows = appointmentRepository.countByStatusForDoctor(doctor, from, to);

        long totalAppointments = 0;
        long completed = 0;
        long scheduled = 0;
        long cancelled = 0;
        long noShow = 0;

        for (Object[] row : statusRows) {
            AppointmentStatus status = (AppointmentStatus) row[0];
            long count = (Long) row[1];
            totalAppointments += count;
            switch (status) {
                case COMPLETED -> completed = count;
                case SCHEDULED -> scheduled = count;
                case CANCELLED -> cancelled = count;
                case NO_SHOW -> noShow = count;
                default -> { /* RESERVED not shown separately */ }
            }
        }

        // ── Earnings ──────────────────────────────────────────────────────────
        BigDecimal totalEarnings = appointmentRepository.sumEarningsForDoctor(doctor, from, to);
        if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;

        // ── Top services ──────────────────────────────────────────────────────
        List<Object[]> serviceRows = appointmentRepository.topServicesByDoctor(
                doctor, from, to, PageRequest.of(0, TOP_SERVICES_LIMIT));

        List<MonthlyReportResponse.ServiceStat> topServices = new ArrayList<>();
        for (Object[] row : serviceRows) {
            topServices.add(MonthlyReportResponse.ServiceStat.builder()
                    .serviceName((String) row[0])
                    .count((Long) row[1])
                    .build());
        }

        // ── Per-center ────────────────────────────────────────────────────────
        List<Object[]> centerRows = appointmentRepository.perCenterBreakdownForDoctor(doctor, from, to);

        List<MonthlyReportResponse.CenterStat> perCenter = new ArrayList<>();
        for (Object[] row : centerRows) {
            BigDecimal centerEarnings = row[3] instanceof BigDecimal bd ? bd : BigDecimal.ZERO;
            perCenter.add(MonthlyReportResponse.CenterStat.builder()
                    .centerName((String) row[0])
                    .total((Long) row[1])
                    .completed(((Number) row[2]).longValue())
                    .earnings(centerEarnings)
                    .build());
        }

        log.info("Monthly report for doctor {} ({}/{}) — {} appointments, earnings: {}",
                doctor.getId(), year, month, totalAppointments, totalEarnings);

        return MonthlyReportResponse.builder()
                .year(year)
                .month(month)
                .totalAppointments(totalAppointments)
                .completed(completed)
                .scheduled(scheduled)
                .cancelled(cancelled)
                .noShow(noShow)
                .totalEarnings(totalEarnings)
                .topServices(topServices)
                .perCenter(perCenter)
                .build();
    }
}
