"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Job } from "@/lib/types";

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <header className="bg-white border-b border-[#e8e8e8] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-mesa.png" alt="Mesa Logo" width={110} height={32} className="object-contain" />
          <span className="text-lg font-semibold text-[#111] tracking-tight">Resume Optimizer</span>
          <span className="text-[#ccc]">/</span>
          <span className="text-lg text-[#999]">Dashboard</span>
        </div>
        <Link
          href="/jobs/new"
          className="text-base bg-[#111] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#333] transition-colors"
        >
          + New Job
        </Link>
      </header>

      <main className="px-8 py-10 max-w-3xl mx-auto">
        {jobs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "Total Jobs", value: jobs.length },
              { label: "JD Confirmed", value: jobs.filter((j) => j.jd_locked).length },
              { label: "In Draft", value: jobs.filter((j) => !j.jd_locked).length },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-[#e8e8e8] rounded-xl px-5 py-4">
                <div className="text-3xl font-semibold text-[#111]">{stat.value}</div>
                <div className="text-base text-[#999] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#bbb] uppercase tracking-widest">Jobs</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-[#999] py-16 justify-center">
            <div className="w-5 h-5 border-2 border-[#ddd] border-t-[#999] rounded-full animate-spin" />
            <span className="text-base">Loading...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#e0e0e0] rounded-2xl bg-white">
            <p className="text-xl text-[#999] mb-2">No jobs yet</p>
            <p className="text-base text-[#bbb]">Create a job to start optimizing resumes</p>
            <Link
              href="/jobs/new"
              className="mt-6 inline-block text-base bg-[#111] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#333] transition-colors"
            >
              Create First Job →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between bg-white border border-[#e8e8e8] rounded-xl px-6 py-5 hover:border-[#ccc] hover:shadow-sm transition-all group"
              >
                <div className="min-w-0">
                  <div className="text-lg font-medium text-[#111] group-hover:text-black truncate">
                    {job.role_name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base text-[#888]">{job.company_name}</span>
                    {job.posting_details && (
                      <>
                        <span className="text-[#ddd]">·</span>
                        <span className="text-base text-[#bbb] truncate max-w-xs">{job.posting_details}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-6">
                  {job.jd_locked ? (
                    <span className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                  <span className="text-base text-[#ccc]">
                    {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[#ccc] group-hover:text-[#999] transition-colors text-lg">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
