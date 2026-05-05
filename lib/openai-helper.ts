import OpenAI from "openai";
import type { ResumeContent } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function optimizeResume(
  resumeText: string,
  jdText: string
): Promise<ResumeContent> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert resume optimizer. Rewrite the candidate's resume to better match the job description while keeping all information truthful. Return ONLY valid JSON with this exact structure:
{
  "name": "string",
  "contact": { "email": "string", "phone": "string", "location": "string" },
  "summary": "string (2-3 sentences tailored to the job)",
  "skills": ["up to 12 relevant skills"],
  "experience": [
    { "title": "string", "company": "string", "duration": "string", "bullets": ["max 3 achievement bullets per role"] }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "string" }
  ]
}
Keep content concise — the resume must fit on one A4 page. Do not fabricate information not present in the original resume.`,
      },
      {
        role: "user",
        content: `JOB DESCRIPTION:\n${jdText}\n\nCANDIDATE RESUME:\n${resumeText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content) as ResumeContent;
}
