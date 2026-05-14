package com.clearbook.api.report;

import com.clearbook.api.model.User;
import com.clearbook.api.report.dto.MonthlyReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Returns a monthly statistics report for the authenticated doctor.
     * Defaults to the current month if year/month are not provided.
     *
     * GET /api/reports/monthly?year=2025&month=5
     */
    @GetMapping("/monthly")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @AuthenticationPrincipal User doctor,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        LocalDate today = LocalDate.now();
        int resolvedYear = (year != null) ? year : today.getYear();
        int resolvedMonth = (month != null) ? month : today.getMonthValue();

        if (resolvedMonth < 1 || resolvedMonth > 12) {
            return ResponseEntity.badRequest().build();
        }
        if (resolvedYear < 2020 || resolvedYear > today.getYear() + 1) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(reportService.getMonthlyReport(doctor, resolvedYear, resolvedMonth));
    }
}
