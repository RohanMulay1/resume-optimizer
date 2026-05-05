import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { company_name, role_name, posting_details, posting_date, jd_text } =
    body;

  if (!company_name || !role_name) {
    return Response.json(
      { error: "company_name and role_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({ company_name, role_name, posting_details, posting_date, jd_text })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
