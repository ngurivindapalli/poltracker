# Supabase setup (cloud accounts + comments)

Politeia / PolTracker uses Supabase for real cloud accounts and database-backed
comments. When the Supabase environment variables are missing, the app
automatically falls back to the original localStorage prototype, so these steps
are only required to enable the cloud features.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign in.
2. Click **New project**, pick an organization, name it (e.g. `politeia`), and
   set a database password.
3. Wait for the project to finish provisioning.

## 2. Copy your project URL and anon key

1. In the project dashboard, open **Project Settings -> API**.
2. Copy the **Project URL**.
3. Copy the **anon public** API key.

## 3. Add environment variables

Create a `.env.local` file in the project root (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit `.env.local` or hardcode keys in source.

## 4. Open the Supabase SQL Editor

In the dashboard, open **SQL Editor -> New query**.

## 5. Run the schema

Open `supabase/schema.sql` from this repository, copy its entire contents into
the SQL editor, and click **Run**. This creates the `profiles`, `comments`, and
`comment_likes` tables, the `updated_at` triggers, indexes, the auto-profile
trigger for new sign ups, and all Row Level Security policies. The script is
safe to re-run.

### Email confirmation (optional)

By default Supabase may require email confirmation before a session is created.
For the smoothest local testing, go to **Authentication -> Providers -> Email**
and disable **Confirm email** so new accounts are logged in immediately. Leave
it on for production if you want verified emails.

## 6. Restart the dev server

Environment variables are read at startup:

```
npm run dev
```

## 7. Test sign up and comments

1. Click **Create Account** in the header and register with an email + password.
2. Open any politician page and scroll to **Community Discussion**.
3. Post a comment, reply, like/unlike, and delete your own comment.
4. Refresh the page and confirm the comments persist (they are stored in
   Supabase, not the browser).
