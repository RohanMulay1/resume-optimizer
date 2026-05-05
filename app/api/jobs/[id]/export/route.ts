import { supabaseAdmin } from "@/lib/supabase";
import { generateResumePDF } from "@/lib/pdf-generate";
import JSZip from "jszip";
import type { ResumeContent } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: resumes, error } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("job_id", id)
    .eq("status", "OPTIMIZED");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!resumes?.length) {
    return Response.json({ error: "No optimized resumes found" }, { status: 404 });
  }

  const zip = new JSZip();

  for (const resume of resumes) {
    if (!resume.optimized_content) continue;
    const pdfBytes = await generateResumePDF(
      resume.optimized_content as ResumeContent
    );
    const safeName = (resume.candidate_name || "resume")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    zip.file(`${safeName}_v${resume.version}.pdf`, pdfBytes);
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="resumes_export.zip"`,
    },
  });
}
