const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const dataFile = path.join(__dirname, "posts.json");
const publicFolder = __dirname;
const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD || "admin";
const pool = databaseUrl
  ? new (require("pg").Pool)({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(publicFolder));

function requireAdmin(req, res, next) {
  if (req.get("x-admin-password") !== adminPassword) {
    return res.status(401).json({ error: "Admin password is required." });
  }

  next();
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id varchar(64) PRIMARY KEY,
      text text NOT NULL,
      image text,
      created_at bigint NOT NULL
    )
  `);
}

function readPosts() {
  try {
    if (!fs.existsSync(dataFile)) {
      return [];
    }
    const raw = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(raw || "[]");
  } catch (error) {
    console.error("Error reading posts.json:", error);
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), "utf8");
}

async function getPostsFromDb() {
  const result = await pool.query(
    'SELECT id, text, image, created_at AS "createdAt" FROM posts ORDER BY created_at ASC'
  );
  return result.rows;
}

function normalizeImportedPosts(input) {
  const importedPosts = Array.isArray(input) ? input : input && input.posts;

  if (!Array.isArray(importedPosts)) {
    const error = new Error("Backup file must contain a posts array.");
    error.status = 400;
    throw error;
  }

  const ids = new Set();

  return importedPosts.map((post) => {
    if (!post || typeof post !== "object") {
      const error = new Error("Every post in the backup must be an object.");
      error.status = 400;
      throw error;
    }

    const id = typeof post.id === "string" && post.id.trim() && !ids.has(post.id)
      ? post.id
      : randomUUID();
    ids.add(id);

    const createdAt = Number.isFinite(Number(post.createdAt))
      ? Number(post.createdAt)
      : Date.now();

    return {
      id,
      text: typeof post.text === "string" ? post.text : "",
      image: typeof post.image === "string" ? post.image : null,
      createdAt
    };
  });
}

app.get("/posts", async (req, res) => {
  try {
    if (pool) {
      const posts = await getPostsFromDb();
      return res.json(posts);
    }

    const posts = readPosts();
    res.json(posts);
  } catch (error) {
    console.error("Failed to load posts:", error);
    res.status(500).json({ error: "Unable to load posts." });
  }
});

app.post("/admin/login", (req, res) => {
  if (req.body && req.body.password === adminPassword) {
    return res.json({ success: true });
  }

  res.status(401).json({ error: "Invalid password." });
});

app.post("/posts", requireAdmin, async (req, res) => {
  const { text, image } = req.body;

  if (!text && !image) {
    return res.status(400).json({ error: "Text or image is required." });
  }

  const newPost = {
    id: randomUUID(),
    text: text || "",
    image: image || null,
    createdAt: Date.now()
  };

  try {
    if (pool) {
      await pool.query(
        'INSERT INTO posts (id, text, image, created_at) VALUES ($1, $2, $3, $4)',
        [newPost.id, newPost.text, newPost.image, newPost.createdAt]
      );
      return res.status(201).json(newPost);
    }

    const posts = readPosts();
    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Failed to save post:", error);
    res.status(500).json({ error: "Unable to save post." });
  }
});

app.delete("/posts/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    if (pool) {
      const result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Post not found." });
      }
      return res.json({ success: true });
    }

    const posts = readPosts();
    const filtered = posts.filter((post) => post.id !== id);

    if (filtered.length === posts.length) {
      return res.status(404).json({ error: "Post not found." });
    }

    writePosts(filtered);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete post:", error);
    res.status(500).json({ error: "Unable to delete post." });
  }
});

app.post("/posts/import", requireAdmin, async (req, res) => {
  try {
    const posts = normalizeImportedPosts(req.body);

    if (pool) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM posts");

        for (const post of posts) {
          await client.query(
            'INSERT INTO posts (id, text, image, created_at) VALUES ($1, $2, $3, $4)',
            [post.id, post.text, post.image, post.createdAt]
          );
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return res.json({ success: true, count: posts.length });
    }

    writePosts(posts);
    res.json({ success: true, count: posts.length });
  } catch (error) {
    console.error("Failed to import posts:", error);
    res.status(error.status || 500).json({ error: error.message || "Unable to import posts." });
  }
});

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
