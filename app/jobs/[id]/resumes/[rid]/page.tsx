"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Resume, ResumeContent } from "@/lib/types";

type ExpEntry = { title: string; company: string; duration: string; bullets: string[] };
type EduEntry = { degree: string; institution: string; year: string };

export default function ResumeEditorPage() {
  const { id, rid } = useParams<{ id: string; rid: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchResume = useCallback(async () => {
    const res = await fetch(`/api/resumes/${rid}`);
    const data: Resume = await res.json();
    setResume(data);
    if (data.optimized_content) setContent(data.optimized_content);
    setLoading(false);
  }, [rid]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  const save = async () => {
    if (!content) return;
    setSaving(true);
    const res = await fetch(`/api/resumes/${rid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optimized_content: content }),
    });
    const data = await res.json();
    setResume(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setField = (path: string, value: unknown) => {
    setContent((prev) => {
      if (!prev) return prev;
      const keys = path.split(".");
      const updated = { ...prev } as Record<string, unknown>;
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...(cur[keys[i]] as object) };
        cur = cur[keys[i]] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = value;
      return updated as ResumeContent;
    });
  };

  const updateExp = (idx: number, field: keyof ExpEntry, value: string | string[]) => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, experience: prev.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) };
    });
  };

  const updateBullet = (expIdx: number, bIdx: number, val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: prev.experience.map((e, i) =>
          i === expIdx ? { ...e, bullets: e.bullets.map((b, j) => j === bIdx ? val : b) } : e
        ),
      };
    });
  };

  const addBullet = (expIdx: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: prev.experience.map((e, i) => i === expIdx ? { ...e, bullets: [...e.bullets, ""] } : e),
      };
    });
  };

  const removeBullet = (expIdx: number, bIdx: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: prev.experience.map((e, i) =>
          i === expIdx ? { ...e, bullets: e.bullets.filter((_, j) => j !== bIdx) } : e
        ),
      };
    });
  };

  const addExp = () => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, experience: [...prev.experience, { title: "", company: "", duration: "", bullets: [""] }] };
    });
  };

  const removeExp = (idx: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, experience: prev.experience.filter((_, i) => i !== idx) };
    });
  };

  const updateEdu = (idx: number, field: keyof EduEntry, value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, education: prev.education.map((e, i) => i === idx ? { ...e, [field]: value } : e) };
    });
  };

  const addEdu = () => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, education: [...prev.education, { degree: "", institution: "", year: "" }] };
    });
  };

  const removeEdu = (idx: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, education: prev.education.filter((_, i) => i !== idx) };
    });
  };

  const inputCls = "w-full bg-white border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-lg text-[#111] placeholder-[#bbb] focus:outline-none focus:border-[#999] transition-colors";
  const labelCls = "block text-base text-[#666] mb-2";
  const sectionCls = "bg-white border border-[#e8e8e8] rounded-xl p-6 space-y-4";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#e0e0e0] border-t-[#999] rounded-full animate-spin" />
      </div>
    );
  }

  if (!content || !resume) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center flex-col gap-4">
        <p className="text-[#999]">this resume hasn&apos;t been optimized yet</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
          go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <header className="bg-white border-b border-[#e8e8e8] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Image src="/logo-mesa.png" alt="Mesa Logo" width={100} height={28} className="object-contain" />
          <Link href="/" className="text-base text-[#999] hover:text-[#555] transition-colors">
            Resume Optimizer
          </Link>
          <span className="text-[#ddd]">/</span>
          <Link href={`/jobs/${id}`} className="text-base text-[#999] hover:text-[#555] transition-colors">
            {resume.candidate_name?.split(" ")[0] ?? "job"}
          </Link>
          <span className="text-[#ddd]">/</span>
          <span className="text-base font-medium text-[#111]">{resume.candidate_name}</span>
          <span className="text-base text-[#bbb] bg-gray-100 px-2.5 py-0.5 rounded-full">
            v{resume.version}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-base text-green-600 font-medium">✓ Saved</span>
          )}
          <a
            href={`/api/resumes/${rid}/pdf`}
            className="text-base bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
          >
            ↓ Download PDF
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="text-base bg-[#111] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      <main className="px-8 py-8 max-w-3xl mx-auto space-y-4">

        {/* Basic Info */}
        <div className={sectionCls}>
          <span className="text-xs text-[#bbb] uppercase tracking-widest">Basic Information</span>
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={content.name} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["email", "phone", "location"] as const).map((f) => (
              <div key={f}>
                <label className={labelCls}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                <input
                  className={inputCls}
                  value={content.contact[f]}
                  onChange={(e) => setField(`contact.${f}`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={sectionCls}>
          <span className="text-xs text-[#bbb] uppercase tracking-widest">Summary</span>
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
            value={content.summary}
            onChange={(e) => setField("summary", e.target.value)}
          />
        </div>

        {/* Skills */}
        <div className={sectionCls}>
          <span className="text-xs text-[#bbb] uppercase tracking-widest">Skills</span>
          <p className="text-base text-[#bbb] -mt-2">Comma-separated</p>
          <input
            className={inputCls}
            value={content.skills.join(", ")}
            onChange={(e) =>
              setField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
            }
          />
          <div className="flex flex-wrap gap-2">
            {content.skills.map((skill, i) => (
              <span key={i} className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className={`${sectionCls} !space-y-5`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#bbb] uppercase tracking-widest">Experience</span>
            <button onClick={addExp} className="text-base text-blue-600 hover:text-blue-800 transition-colors">
              + Add Role
            </button>
          </div>

          {content.experience.map((exp, i) => (
            <div key={i} className="border border-[#e8e8e8] rounded-xl p-5 space-y-4 bg-[#fafafa]">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-[#666]">Role {i + 1}</span>
                <button onClick={() => removeExp(i)} className="text-base text-[#ccc] hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input className={inputCls} value={exp.title} onChange={(e) => updateExp(i, "title", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <input className={inputCls} value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <input
                    className={inputCls}
                    value={exp.duration}
                    onChange={(e) => updateExp(i, "duration", e.target.value)}
                    placeholder="2020 – Present"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Bullets</label>
                <div className="space-y-2">
                  {exp.bullets.map((b, j) => (
                    <div key={j} className="flex gap-2 items-center">
                      <span className="text-[#ccc] text-base flex-shrink-0">•</span>
                      <input
                        className={`${inputCls} flex-1`}
                        value={b}
                        onChange={(e) => updateBullet(i, j, e.target.value)}
                        placeholder="Achievement or responsibility"
                      />
                      <button
                        onClick={() => removeBullet(i, j)}
                        className="text-[#ccc] hover:text-red-500 flex-shrink-0 transition-colors text-base"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addBullet(i)} className="text-base text-blue-600 hover:text-blue-800 mt-1 transition-colors">
                    + Add Bullet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className={`${sectionCls} !space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#bbb] uppercase tracking-widest">Education</span>
            <button onClick={addEdu} className="text-base text-blue-600 hover:text-blue-800 transition-colors">
              + Add
            </button>
          </div>
          {content.education.map((edu, i) => (
            <div key={i} className="border border-[#e8e8e8] rounded-xl p-5 bg-[#fafafa]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium text-[#666]">Entry {i + 1}</span>
                <button onClick={() => removeEdu(i)} className="text-base text-[#ccc] hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Year</label>
                  <input className={inputCls} value={edu.year} onChange={(e) => updateEdu(i, "year", e.target.value)} placeholder="2020" />
                </div>
                <div>
                  <label className={labelCls}>Degree</label>
                  <input className={inputCls} value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} placeholder="B.S. Computer Science" />
                </div>
                <div>
                  <label className={labelCls}>Institution</label>
                  <input className={inputCls} value={edu.institution} onChange={(e) => updateEdu(i, "institution", e.target.value)} placeholder="MIT" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pb-10 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="text-base bg-[#111] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
