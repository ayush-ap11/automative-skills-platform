"use client";

import { Calendar, FileText, Lock, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  SENSITIVE_CATEGORIES,
} from "@/app/(admin)/admin/documents/constants";
import { AdminDocumentReviewDialog } from "./AdminDocumentReviewDialog";

export interface AdminDocumentItem {
  id: string;
  candidate_name: string;
  candidate_id: string;
  category: string;
  file_name: string;
  status: string;
  is_sensitive: boolean;
  uploaded_at: string;
  expiry_date: string | null;
}

interface Props {
  initialDocuments: AdminDocumentItem[];
  filteredCandidateName?: string | null;
}

export function AdminDocumentQueue({
  initialDocuments,
  filteredCandidateName,
}: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<AdminDocumentItem[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (
        search &&
        !d.candidate_name.toLowerCase().includes(search.toLowerCase()) &&
        !d.file_name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (catFilter !== "all" && d.category !== catFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      const isSens =
        d.is_sensitive || SENSITIVE_CATEGORIES.includes(d.category);
      if (sensitiveOnly && !isSens) return false;
      return true;
    });
  }, [docs, search, catFilter, statusFilter, sensitiveOnly]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      uploaded: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      ai_extracted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      pending_review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      verified:
        "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${map[status] || "bg-muted text-muted-foreground border-border"}`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const getExpiryBadge = (exp: string | null) => {
    if (!exp) return null;
    const diff = (new Date(exp).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (diff < 0)
      return (
        <span className="text-[10px] text-destructive font-semibold">
          Expired
        </span>
      );
    if (diff <= 30)
      return (
        <span className="text-[10px] text-amber-600 font-semibold">
          Exp: {exp}
        </span>
      );
    return (
      <span className="text-[10px] text-muted-foreground">Exp: {exp}</span>
    );
  };

  return (
    <div className="space-y-4">
      {filteredCandidateName && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs">
          <span>
            Showing documents for <strong>{filteredCandidateName}</strong>
          </span>
          <Link
            href="/admin/documents"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
          >
            <X className="size-3.5" /> Clear candidate filter
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card text-xs">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidate or file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-xs"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-md border border-border bg-background p-1.5 text-xs cursor-pointer"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background p-1.5 text-xs cursor-pointer capitalize"
        >
          <option value="all">All Statuses</option>
          {[
            "uploaded",
            "ai_extracted",
            "pending_review",
            "verified",
            "rejected",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-background cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={sensitiveOnly}
            onChange={(e) => setSensitiveOnly(e.target.checked)}
            className="rounded cursor-pointer"
          />
          <Lock className="size-3 text-amber-600" /> Sensitive Only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-xs">
          <FileText className="size-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            No documents match these filters — try adjusting search or filters.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {filtered.map((doc) => {
            const isSens =
              doc.is_sensitive || SENSITIVE_CATEGORIES.includes(doc.category);
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-foreground">
                      {doc.candidate_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      • {CATEGORY_LABELS[doc.category] || doc.category}
                    </span>
                    {isSens && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        <Lock className="size-3" /> Sensitive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="size-3" /> {doc.file_name}
                    </span>
                    <span>•</span>
                    <span
                      className="inline-flex items-center gap-1"
                      suppressHydrationWarning
                    >
                      <Calendar className="size-3" />{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString("en-AU")}
                    </span>
                    {doc.expiry_date && (
                      <>
                        <span>•</span>
                        {getExpiryBadge(doc.expiry_date)}
                      </>
                    )}
                  </div>
                </div>
                <div className="self-start sm:self-auto">
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminDocumentReviewDialog
        documentId={selectedDocId}
        open={Boolean(selectedDocId)}
        onOpenChange={(open) => !open && setSelectedDocId(null)}
        onReviewed={(id) => {
          setDocs((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: "verified" } : d)),
          );
          router.refresh();
        }}
      />
    </div>
  );
}
