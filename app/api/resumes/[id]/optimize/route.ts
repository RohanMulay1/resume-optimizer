import { supabaseAdmin } from "@/lib/supabase";
import { optimizeResume } from "@/lib/openai-helper";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch resume
  const { data: resume, error: resumeError } = await supabaseAdmin
    .from("resumes")
    .select("*, jobs(jd_text)")
    .eq("id", id)
    .single();

  if (resumeError || !resume) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  if (!resume.raw_text) {
    return Response.json(
      { error: "No parsed text available for optimization" },
      { status: 400 }
    );
  }

  const job = resume.jobs as { jd_text: string } | null;
  if (!job?.jd_text) {
    return Response.json({ error: "Job has no JD text" }, { status: 400 });
  }

  // Mark as processing
  await supabaseAdmin
    .from("resumes")
    .update({ status: "PROCESSING" })
    .eq("id", id);

  try {
    const optimizedContent = await optimizeResume(resume.raw_text, job.jd_text);

    // Extract candidate name from optimized content
    const candidateName = optimizedContent.name || resume.candidate_name;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("resumes")
      .update({
        status: "OPTIMIZED",
        optimized_content: optimizedContent,
        candidate_name: candidateName,
        version: (resume.version ?? 1) + 1,
        error_message: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Optimization failed";
    await supabaseAdmin
      .from("resumes")
      .update({ status: "FAILED_OPTIMIZATION", error_message: message })
      .eq("id", id);

    return Response.json({ error: message }, { status: 500 });
  }
}
