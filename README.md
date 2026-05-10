# Deokso-Lab

Simple Express site for posting text and images.

## Why posts disappear on Render

Render's web service disk is not a permanent database. When the free service sleeps,
restarts, redeploys, or moves to another instance, anything saved only in
`posts.json` can disappear.

This app already supports persistent storage with PostgreSQL. When the server has a
`DATABASE_URL` environment variable, it saves posts to the database instead of
`posts.json`.

## Local setup

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Without `DATABASE_URL`, local posts are saved in `posts.json`.

## Persistent posts on Render

1. Create a PostgreSQL database. Render PostgreSQL, Neon, Supabase, or any hosted
   Postgres database will work. If you use Render Free Postgres, check Render's
   current limits first because free databases can expire.
2. Copy the database's external connection string.
3. In your Render web service, go to **Environment**.
4. Add this environment variable:

```text
DATABASE_URL=your_postgres_connection_string
```

5. Redeploy the web service.

On startup, `server.js` automatically creates the `posts` table if it does not
exist.

You can also set a safer admin password in Render:

```text
ADMIN_PASSWORD=choose_a_private_password
```

If you do not set `ADMIN_PASSWORD`, the app uses `admin`.

## Important image note

Uploaded images are stored as base64 text inside the post. That is fine for small
school-project images, but large images can make the database grow quickly. Resize
images before uploading when possible.

## Manual backups

After logging in as admin, use **백업 다운로드** to save every post to a JSON
file on your computer. Keep that file somewhere safe.

To restore a backup, log in as admin, click **백업 복원**, and choose the JSON
backup file. Restoring replaces the current posts with the posts from the backup
file.
