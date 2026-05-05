import { supabaseAdmin } from "@/lib/supabase";
import { generateResumePDF } from "@/lib/pdf-generate";
import type { ResumeContent } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: resume, error } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !resume) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  if (!resume.optimized_content) {
    return Response.json(
      { error: "Resume has not been optimized yet" },
      { status: 400 }
    );
  }

  const pdfBytes = await generateResumePDF(
    resume.optimized_content as ResumeContent
  );

  const safeName = (resume.candidate_name || "resume")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  return new Response(pdfBytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_v${resume.version}.pdf"`,
    },
  });
}
