"use server"

import { callApi } from "@/lib/server/api-action"
import { springFetch } from "@/lib/server/spring"
import type { ActionResult } from "@/types/api"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceStat = {
  serviceName: string;
  count: number;
};

export type CenterStat = {
  centerName: string;
  total: number;
  completed: number;
  earnings: number;
};

export type MonthlyReport = {
  year: number;
  month: number;
  totalAppointments: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
  totalEarnings: number;
  topServices: ServiceStat[];
  perCenter: CenterStat[];
};

// ── Actions ───────────────────────────────────────────────────────────────────

export async function getMonthlyReportAction(
  year: number,
  month: number
): Promise<ActionResult<MonthlyReport>> {
  return callApi<MonthlyReport>(
    () =>
      springFetch(`/api/reports/monthly?year=${year}&month=${month}`, {
        method: "GET",
      }),
    "Failed to fetch monthly report."
  );
}
