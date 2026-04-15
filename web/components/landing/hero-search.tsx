"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type SpecializationOption = { code: string; name: string };

interface HeroSearchProps {
  specializations: SpecializationOption[];
  defaultSpecialization?: string;
  defaultCity?: string;
}

export function HeroSearch({
  specializations,
  defaultSpecialization = "",
  defaultCity = "",
}: HeroSearchProps) {
  const router = useRouter();
  const [specialization, setSpecialization] = useState(defaultSpecialization);
  const [city, setCity] = useState(defaultCity);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (specialization) params.set("specialization", specialization);
    if (city.trim()) params.set("city", city.trim());
    router.push(`/doctors${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      {/* Specialization */}
      <div className="relative flex-1">
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="w-full appearance-none rounded-xl border-0 bg-white px-4 py-3.5 text-sm text-[#102240] shadow-sm ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36A372]"
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* City */}
      <div className="relative flex-1">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Warsaw)"
          className="w-full rounded-xl border-0 bg-white px-4 py-3.5 text-sm text-[#102240] shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#36A372]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#36A372] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#297A56] focus:outline-none focus:ring-2 focus:ring-[#36A372] focus:ring-offset-2 focus:ring-offset-[#102240]"
      >
        <Search size={16} />
        Search
      </button>
    </form>
  );
}
