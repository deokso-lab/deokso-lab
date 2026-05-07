const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const dataFile = path.join(__dirname, "posts.json");
const publicFolder = __dirname;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(publicFolder));

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

app.get("/posts", (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

app.post("/posts", (req, res) => {
  const { text, image } = req.body;

  if (!text && !image) {
    return res.status(400).json({ error: "Text or image is required." });
  }

  const posts = readPosts();
  const newPost = {
    id: randomUUID(),
    text: text || "",
    image: image || null,
    createdAt: Date.now()
  };

  posts.push(newPost);
  writePosts(posts);
  res.status(201).json(newPost);
});

app.delete("/posts/:id", (req, res) => {
  const posts = readPosts();
  const id = req.params.id;
  const filtered = posts.filter((post) => post.id !== id);

  if (filtered.length === posts.length) {
    return res.status(404).json({ error: "Post not found." });
  }

  writePosts(filtered);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
