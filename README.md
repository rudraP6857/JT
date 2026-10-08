# StatusHired

A modern career pipeline, interview tracker, and job application command center built with React, TypeScript, Vite, Tailwind CSS, `@supabase/supabase-js`, `lucide-react`, `framer-motion`, and `date-fns`.

## Local Quick Start (Windows)

### Option A: 1-Click Batch File
- Double-click **`start-windows.bat`** (or **`fix-windows.bat`** if resetting).

### Option B: Command Prompt / PowerShell
1. Open the project folder in terminal:
   ```cmd
   cd "C:\Users\patel\Desktop\Job studio"
   ```
2. If resetting from a previous failed install:
   ```cmd
   rmdir /s /q node_modules
   del package-lock.json
   ```
3. Copy environment configuration:
   - **Command Prompt (CMD)**: `copy .env.example .env`
   - **PowerShell**: `Copy-Item .env.example .env`
   - *(Note: A default `.env` file is already included in this download).*
4. Install dependencies:
   ```cmd
   npm install
   ```
5. Start development server:
   ```cmd
   npm run dev
   ```
6. Open your browser at **http://localhost:3000**

## Demo Mode vs Live Supabase

- **Instant Demo Mode (No Supabase Account Required)**:
  - You can immediately click **"Explore Demo Mode"** on the login page or enter any email.
  - The app launches with preloaded applications, kanban board, reminders, and charts.
  - Full local editing, drag-and-drop, and status transitions work in-memory without needing any cloud setup.

- **Live Supabase Mode (Persistent Cloud Storage)**:
  - If you want cloud persistence across devices, provide your real Supabase credentials in `.env`:
    ```bash
    VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
    VITE_SUPABASE_ANON_KEY="<your-supabase-anon-key>"
    ```
  - Run the SQL schema from `/supabase/schema.sql` in your Supabase SQL Editor.
  - Restart with `npm run dev`.

---

## Setup & Supabase Configuration

StatusHired is designed to persist all application data in Supabase Postgres and store PDF resumes in a private Supabase Storage bucket.

### 1. Database Schema Execution

The complete database schema is ready in `/supabase/schema.sql`.

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** &rarr; click **New Query**.
3. Copy the entire contents of `/supabase/schema.sql` and click **Run**.

This script automatically provisions:
- `user_settings`: stores user theme preferences (`system`, `light`, `dark`) and notification settings.
- `resumes`: records metadata of uploaded resumes.
- `applications`: records job applications across 6 stages (`saved`, `applied`, `assessment`, `interview`, `selected`, `rejected`).
- `stage_history`: logs timestamped transitions whenever an application moves between stages.
- `reminders`: tracks scheduled interview prep deadlines, take-homes, and follow-ups.
- **Row Level Security (RLS)**: enabled on every table with policies enforcing `auth.uid() = user_id`.
- **Triggers**:
  - `handle_updated_at`: updates `applications.updated_at`.
  - `handle_stage_transition_history`: automatically logs every stage movement to `stage_history`.
- **Storage Bucket**: creates a private bucket named `resumes` (PDF only, 5MB limit) with policies restricting access to folders named after `auth.uid()`.
- **Realtime**: enables realtime replication for `applications` and `reminders`.

### 2. Configure Environment Variables

Set the following variables in your `.env` file or environment settings:

```bash
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-supabase-anon-key>"
```

### 3. Google OAuth Setup & Redirect URL

To enable "Continue with Google":

1. In your **Supabase Dashboard**, navigate to **Authentication** &rarr; **Providers** &rarr; **Google**.
2. Toggle Google to **Enabled**.
3. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create or configure an OAuth 2.0 Client ID:
   - **Authorized JavaScript origins**: your app domain (e.g. `https://your-domain.run.app`).
   - **Authorized redirect URIs**: enter your Supabase Callback URL from the Supabase dashboard (format: `https://<your-project-ref>.supabase.co/auth/v1/callback`).
4. Paste the **Client ID** and **Client Secret** into the Supabase Google provider settings and save.
5. In Supabase **Authentication** &rarr; **URL Configuration**, add your application URL to **Site URL** and **Redirect URLs**.

### 4. Strict Cookie Session Storage (No LocalStorage)

In compliance with strict security requirements:
- The Supabase client is configured in `src/lib/supabase.ts` with a **custom cookie auth storage adapter**.
- Sessions are stored in HTTP cookies (`document.cookie`, `SameSite=Lax`, 30-day expiry).
- Neither `localStorage` nor `sessionStorage` is used anywhere in the codebase.
- `persistSession: true` and `autoRefreshToken: true` are enabled on the custom adapter.

### 4. Design System

- **Fonts**: Plus Jakarta Sans for headings, Inter for body text.
- **Colors**:
  - Light mode: Background `#F7F8FC`, Surface `#FFFFFF`, Border `#E8EAF2`, Text `#0F172A`, Muted `#64748B`.
  - Dark mode: Background `#0B0E17`, Surface `#121626`, Border `#1F2437`, Text `#E8EBF5`, Muted `#8B93AB`.
  - Primary: Indigo-Violet gradient (`#6366F1` &rarr; `#8B5CF6`).
  - Accent: Mint (`#34D399`).
  - Warning: Amber (`#F59E0B`).
  - Danger: Rose (`#F43F5E`).
- **Pipeline Stage Badges**:
  - `saved`: Slate
  - `applied`: Blue
  - `assessment`: Amber
  - `interview`: Violet
  - `selected`: Emerald
  - `rejected`: Rose
