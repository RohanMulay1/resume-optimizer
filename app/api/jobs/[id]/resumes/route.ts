import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  // Check job exists and JD is present
  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("jd_text, jd_locked")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return Response.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > 10) {
    return Response.json(
      { error: "Maximum 10 files per batch" },
      { status: 400 }
    );
  }

  // Dynamically import pdf-parse to avoid Turbopack bundling issues
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    buf: Buffer
  ) => Promise<{ text: string }>;

  const results = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    let status = "QUEUED";
    let errorMessage = "";

    // Try parsing once, retry once on failure
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text;
        status = "QUEUED";
        errorMessage = "";
        break;
      } catch {
        if (attempt === 1) {
          status = "FAILED_PARSING";
          errorMessage = "Failed to parse PDF";
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("resumes")
      .insert({
        job_id: jobId,
        original_filename: file.name,
        candidate_name: file.name.replace(/\.pdf$/i, ""),
        status,
        raw_text: rawText,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (error) {
      results.push({ filename: file.name, error: error.message });
    } else {
      results.push(data);
    }
  }

  return Response.json(results, { status: 201 });
}
