This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment on Vercel

This project is optimized for deployment on Vercel.

### 1. Prerequisites

- A [Supabase](https://supabase.com/) project.
- An [OpenAI](https://openai.com/) API key.

### 2. Environment Variables

Configure the following environment variables in your Vercel project settings:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Project Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (for admin access) |
| `OPENAI_API_KEY` | Your OpenAI API Key |

### 3. Database Schema

Ensure your Supabase project has the following tables:

**`jobs`**
- `id`: uuid (primary key)
- `company_name`: text
- `role_name`: text
- `posting_details`: text
- `posting_date`: text
- `jd_text`: text
- `jd_locked`: boolean (default: false)
- `created_at`: timestamp with time zone (default: now())

**`resumes`**
- `id`: uuid (primary key)
- `job_id`: uuid (foreign key to `jobs.id`)
- `original_filename`: text
- `candidate_name`: text
- `status`: text (UPLOADED, PARSING, QUEUED, PROCESSING, OPTIMIZED, etc.)
- `raw_text`: text
- `optimized_content`: jsonb
- `version`: integer (default: 1)
- `error_message`: text
- `created_at`: timestamp with time zone (default: now())

### 4. Deploy

1. Connect your GitHub repository to Vercel.
2. Add the environment variables listed above.
3. Deploy!

## Learn More


To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
