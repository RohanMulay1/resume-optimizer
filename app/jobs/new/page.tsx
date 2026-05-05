"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    role_name: "",
    posting_details: "",
    posting_date: new Date().toISOString().split("T")[0],
    jd_text: "",
  });

  const set = (field: string, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.role_name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/jobs/${data.id}`);
      } else {
        alert(data.error || "Failed to create job");
        setSaving(false);
      }
    } catch {
      alert("Failed to create job");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-white border border-[#e0e0e0] rounded-lg px-4 py-3 text-lg text-[#111] placeholder-[#bbb] focus:outline-none focus:border-[#999] transition-colors";

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <header className="bg-white border-b border-[#e8e8e8] px-8 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#111] rounded-md flex items-center justify-center">
          <span className="text-white text-base font-bold">R</span>
        </div>
        <Link href="/" className="text-lg text-[#999] hover:text-[#555] transition-colors">
          Resume Optimizer
        </Link>
        <span className="text-[#ddd]">/</span>
        <span className="text-lg font-medium text-[#111]">New Job</span>
      </header>

      <main className="px-8 py-10 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111]">Create New Job</h1>
          <p className="text-base text-[#999] mt-1">
            Set up a job workflow and paste the job description
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-6 space-y-5">
            <span className="text-sm text-[#bbb] uppercase tracking-widest">Job Details</span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-[#666] mb-2">Company Name *</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="Acme Corp"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-base text-[#666] mb-2">Role Name *</label>
                <input
                  type="text"
                  value={form.role_name}
                  onChange={(e) => set("role_name", e.target.value)}
                  placeholder="Senior Engineer"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-[#666] mb-2">Posting Date</label>
                <input
                  type="date"
                  value={form.posting_date}
                  onChange={(e) => set("posting_date", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-base text-[#666] mb-2">Posting Details</label>
                <input
                  type="text"
                  value={form.posting_details}
                  onChange={(e) => set("posting_details", e.target.value)}
                  placeholder="Full-time · Remote · $120k"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#bbb] uppercase tracking-widest">Job Description</span>
              <span className="text-base text-[#ccc]">{form.jd_text.length} chars</span>
            </div>
            <textarea
              value={form.jd_text}
              onChange={(e) => set("jd_text", e.target.value)}
              placeholder="Paste the full job description here. This is used to tailor each resume to the role..."
              rows={14}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/" className="text-base text-[#999] hover:text-[#555] transition-colors">
              ← Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !form.company_name || !form.role_name}
              className="text-base bg-[#111] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Creating..." : "Create Job →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
