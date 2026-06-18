import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { brl } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/")({{
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard · Aurora" }] }),
});

interface ClientRow {
  id: string;
  name: string;
  status: string;
  last_upload_at: string | null;
}

interface ClientSummary extends ClientRow {
  receita: number;
  saldo: number;
  pendentes: number;
  banks: string[];
}

interface TrendPoint {
  mes: string;
  rec: number;
  des: number;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
