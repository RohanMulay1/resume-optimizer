"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Job, Resume, ResumeStatus } from "@/lib/types";

const STATUS_STYLES: Record<ResumeStatus, string> = {
  UPLOADED:            "bg-gray-50 text-gray-500 border-gray-200",
  PARSING:             "bg-purple-50 text-purple-700 border-purple-200",
  QUEUED:              "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING:          "bg-blue-50 text-blue-700 border-blue-200",
  OPTIMIZED:           "bg-green-50 text-green-700 border-green-200",
  FAILED_PARSING:      "bg-red-50 text-red-700 border-red-200",
  FAILED_OPTIMIZATION: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<ResumeStatus, string> = {
  UPLOADED:            "Uploaded",
  PARSING:             "Parsing…",
  QUEUED:              "Queued",
  PROCESSING:          "Processing…",
  OPTIMIZED:           "Optimized",
  FAILED_PARSING:      "Parse Failed",
  FAILED_OPTIMIZATION: "AI Failed",
};

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJd, setEditingJd] = useState(false);
  const [jdDraft, setJdDraft] = useState("");
  const [savingJd, setSavingJd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [optimizingIds, setOptimizingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const [jobRes, resumesRes] = await Promise.all([
      fetch(`/api/jobs/${id}`),
      fetch(`/api/jobs/${id}/resumes`),
    ]);
    const [jobData, resumesData] = await Promise.all([
      jobRes.json(),
      resumesRes.json(),
    ]);
    setJob(jobData);
    setJdDraft(jobData.jd_text || "");
    setResumes(Array.isArray(resumesData) ? resumesData : []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveJd = async (lock: boolean) => {
    setSavingJd(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd_text: jdDraft, jd_locked: lock }),
    });
    const data = await res.json();
    setJob(data);
    setEditingJd(false);
    setSavingJd(false);
  };

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    await fetch(`/api/jobs/${id}/resumes`, { method: "POST", body: form });
    await fetchData();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const optimizeOne = async (resumeId: string) => {
    setOptimizingIds((s) => new Set([...s, resumeId]));
    setResumes((rs) =>
      rs.map((r) => (r.id === resumeId ? { ...r, status: "PROCESSING" } : r))
    );
    try {
      const res = await fetch(`/api/resumes/${resumeId}/optimize`, { method: "POST" });
      const data = await res.json();
      setResumes((rs) => rs.map((r) => (r.id === resumeId ? data : r)));
    } catch {
      setResumes((rs) =>
        rs.map((r) => r.id === resumeId ? { ...r, status: "FAILED_OPTIMIZATION" } : r)
      );
    }
    setOptimizingIds((s) => { const n = new Set(s); n.delete(resumeId); return n; });
  };

  const optimizeAll = async () => {
    for (const r of resumes.filter((r) => r.status === "QUEUED")) {
      await optimizeOne(r.id);
    }
  };

  const deleteResume = async (resumeId: string) => {
    if (!confirm("Delete this resume?")) return;
    setDeletingIds((s) => new Set([...s, resumeId]));
    await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
    setResumes((rs) => rs.filter((r) => r.id !== resumeId));
    setDeletingIds((s) => { const n = new Set(s); n.delete(resumeId); return n; });
  };

  const queuedCount = resumes.filter((r) => r.status === "QUEUED").length;
  const optimizedCount = resumes.filter((r) => r.status === "OPTIMIZED").length;
  const processingCount = resumes.filter((r) => r.status === "PROCESSING").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#e0e0e0] border-t-[#999] rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-lg text-[#999]">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <header className="bg-white border-b border-[#e8e8e8] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#111] rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base font-bold">R</span>
          </div>
          <Link href="/" className="text-lg text-[#999] hover:text-[#555] transition-colors">
            Resume Optimizer
          </Link>
          <span className="text-[#ddd]">/</span>
          <span className="text-lg font-medium text-[#111] truncate max-w-xs">{job.role_name}</span>
          <span className="text-base text-[#bbb] hidden sm:block">@ {job.company_name}</span>
        </div>
        {optimizedCount > 0 && (
          <a
            href={`/api/jobs/${id}/export`}
            className="text-base bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-lg hover:bg-green-100 transition-colors"
          >
            ↓ Export All ({optimizedCount})
          </a>
        )}
      </header>

      <main className="px-8 py-8 max-w-4xl mx-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: resumes.length },
            { label: "Queued", value: queuedCount },
            { label: "Processing", value: processingCount },
            { label: "Optimized", value: optimizedCount },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e8e8e8] rounded-xl px-5 py-4">
              <div className="text-3xl font-semibold text-[#111]">{s.value}</div>
              <div className="text-base text-[#999] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* JD Section */}
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#bbb] uppercase tracking-widest">Job Description</span>
              {job.jd_locked ? (
                <span className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  Confirmed
                </span>
              ) : (
                <span className="text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                  Draft
                </span>
              )}
            </div>
            {!job.jd_locked && !editingJd && (
              <button
                onClick={() => setEditingJd(true)}
                className="text-base text-[#999] hover:text-[#555] transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingJd ? (
            <div className="space-y-3">
              <textarea
                value={jdDraft}
                onChange={(e) => setJdDraft(e.target.value)}
                rows={10}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-4 py-3 text-lg text-[#111] focus:outline-none focus:border-[#999] resize-none leading-relaxed"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setEditingJd(false); setJdDraft(job.jd_text || ""); }}
                  className="text-base text-[#999] hover:text-[#555] px-3 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveJd(false)}
                  disabled={savingJd}
                  className="text-base bg-gray-100 text-gray-700 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => saveJd(true)}
                  disabled={savingJd || !jdDraft.trim()}
                  className="text-base bg-[#111] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#333] disabled:opacity-40 transition-colors"
                >
                  {savingJd ? "Saving..." : "Confirm JD →"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {job.jd_text ? (
                <pre className="text-base text-[#666] whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                  {job.jd_text}
                </pre>
              ) : (
                <p className="text-base text-[#bbb]">
                  No job description yet —{" "}
                  <button onClick={() => setEditingJd(true)} className="text-[#999] underline underline-offset-2">
                    Add one
                  </button>
                </p>
              )}
              {!job.jd_locked && job.jd_text && (
                <button
                  onClick={() => saveJd(true)}
                  className="mt-4 text-base bg-[#111] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#333] transition-colors"
                >
                  Confirm JD →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resumes */}
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm text-[#bbb] uppercase tracking-widest">Resumes</span>
            <div className="flex items-center gap-3">
              {processingCount > 0 && (
                <span className="text-base text-blue-600 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  {processingCount} Processing
                </span>
              )}
              {queuedCount > 0 && processingCount === 0 && (
                <button
                  onClick={optimizeAll}
                  className="text-base bg-[#111] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#333] transition-colors"
                >
                  ✦ Optimize All ({queuedCount})
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-base bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                {uploading ? "Uploading..." : "+ Upload"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </div>
          </div>

          {resumes.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all ${
                dragOver ? "border-[#999] bg-gray-50" : "border-[#e0e0e0] hover:border-[#ccc]"
              }`}
            >
              <p className="text-lg text-[#999]">Drop PDF resumes here</p>
              <p className="text-base text-[#ccc] mt-1">Or click to browse · Up to 10 per batch</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-12 gap-3 px-3 pb-3 border-b border-[#f0f0f0]">
                <div className="col-span-5 text-sm text-[#bbb] uppercase tracking-wider">Candidate</div>
                <div className="col-span-3 text-sm text-[#bbb] uppercase tracking-wider">Status</div>
                <div className="col-span-1 text-sm text-[#bbb] uppercase tracking-wider">Ver</div>
                <div className="col-span-3 text-sm text-[#bbb] uppercase tracking-wider text-right">Actions</div>
              </div>

              <div className="divide-y divide-[#f5f5f5]">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="grid grid-cols-12 gap-3 items-center px-3 py-4 hover:bg-[#fafafa] transition-colors group"
                  >
                    <div className="col-span-5 min-w-0">
                      <div className="text-lg text-[#111] truncate font-medium">
                        {resume.candidate_name || resume.original_filename}
                      </div>
                      <div className="text-sm text-[#bbb] truncate mt-0.5">
                        {resume.original_filename}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border ${STATUS_STYLES[resume.status]}`}>
                        {resume.status === "PROCESSING" && (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {STATUS_LABEL[resume.status]}
                      </span>
                    </div>

                    <div className="col-span-1 text-base text-[#bbb]">v{resume.version}</div>

                    <div className="col-span-3 flex items-center gap-3 justify-end">
                      {(resume.status === "QUEUED" || resume.status === "FAILED_OPTIMIZATION") && (
                        <button
                          onClick={() => optimizeOne(resume.id)}
                          disabled={optimizingIds.has(resume.id)}
                          className="text-base text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
                        >
                          {optimizingIds.has(resume.id) ? "..." : "Optimize"}
                        </button>
                      )}
                      {resume.status === "OPTIMIZED" && (
                        <>
                          <Link
                            href={`/jobs/${id}/resumes/${resume.id}`}
                            className="text-base text-[#666] hover:text-[#111] transition-colors"
                          >
                            Edit
                          </Link>
                          <a
                            href={`/api/resumes/${resume.id}/pdf`}
                            className="text-base text-green-700 hover:text-green-900 transition-colors"
                          >
                            PDF
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => deleteResume(resume.id)}
                        disabled={deletingIds.has(resume.id)}
                        className="text-base text-[#ddd] hover:text-red-500 group-hover:text-[#bbb] disabled:opacity-40 transition-colors"
                      >
                        {deletingIds.has(resume.id) ? "..." : "✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-3 mt-2 rounded-lg border border-dashed border-[#e8e8e8] hover:border-[#ccc] cursor-pointer transition-colors"
              >
                <span className="text-base text-[#ccc] hover:text-[#999]">+ Upload More Resumes</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
