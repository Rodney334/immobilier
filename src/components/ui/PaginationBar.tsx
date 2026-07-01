"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type Props = {
  /** Total d'éléments */
  total: number;
  /** Page courante (1-indexed) */
  page: number;
  /** Nombre d'éléments par page */
  limit: number;
  /** Libellé du type d'élément au pluriel, ex. "contrats" */
  itemLabel?: string;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
};

export function PaginationBar({
  total,
  page,
  limit,
  itemLabel = "éléments",
  onPage,
  onLimit,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="ep-pagination">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
        {total === 0
          ? `0 ${itemLabel}`
          : `${from}–${to} sur ${total} ${itemLabel}`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={limit}
          onChange={(e) => { onLimit(Number(e.target.value)); onPage(1); }}
          style={{
            fontSize: 11.5,
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--paper-line)",
            borderRadius: "var(--r-sm)",
            padding: "3px 6px",
            background: "var(--paper-raised)",
            color: "var(--ink-soft)",
            cursor: "pointer",
          }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <button
          className="ep-page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={13} />
        </button>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            padding: "0 6px",
            color: "var(--ink-soft)",
          }}
        >
          {page} / {totalPages}
        </span>
        <button
          className="ep-page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
