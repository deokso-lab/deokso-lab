let isAdmin = false;

window.onload = function() {
  setupAdminButtonFade();
  setupFileNamePreview();
  setupSearch();
  showPosts();

  document.getElementById("editor").style.display = "none";
};

function setupAdminButtonFade() {
  const adminBtn = document.getElementById("adminBtn");
  const line = document.querySelector("hr");

  function updateAdminButton() {
    if (line.getBoundingClientRect().top <= 0) {
      adminBtn.classList.add("hidden");
    } else {
      adminBtn.classList.remove("hidden");
    }
  }

  updateAdminButton();
  window.addEventListener("scroll", updateAdminButton);
  window.addEventListener("resize", updateAdminButton);
}

function setupFileNamePreview() {
  const imageInput = document.getElementById("imageInput");
  const fileName = document.getElementById("fileName");
  const imagePreview = document.getElementById("imagePreview");

  imageInput.addEventListener("change", function() {
    const file = imageInput.files[0];
    fileName.textContent = file ? file.name : "선택된 파일 없음";
    imagePreview.innerHTML = "";

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = "Selected image preview";
      imagePreview.appendChild(img);
    };

    reader.readAsDataURL(file);
  });
}

function setupSearch() {
  document.getElementById("searchInput").addEventListener("input", showPosts);
}

function getPosts() {
  return JSON.parse(localStorage.getItem("posts") || "[]");
}

function savePosts(posts) {
  localStorage.setItem("posts", JSON.stringify(posts));
}

function resetEditor() {
  document.getElementById("content").value = "";
  document.getElementById("imageInput").value = "";
  document.getElementById("fileName").textContent = "선택된 파일 없음";
  document.getElementById("imagePreview").innerHTML = "";
}

function login() {
  if (document.getElementById("pw").value === "admin") {
    isAdmin = true;

    const editor = document.getElementById("editor");
    editor.style.display = "block";
    editor.classList.add("active");

    closeModal();
    showPosts();
  } else {
    alert("비밀번호가 틀렸습니다");
  }
}

function logout() {
  isAdmin = false;

  document.getElementById("editor").style.display = "none";
  showPosts();
}

function addPost() {
  if (!isAdmin) {
    alert("관리자만 게시물을 작성할 수 있습니다");
    return;
  }

  const text = document.getElementById("content").value;
  const file = document.getElementById("imageInput").files[0];

  if (!text && !file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const posts = getPosts();

    posts.push({
      text: text,
      image: e.target.result,
      createdAt: Date.now()
    });

    savePosts(posts);
    resetEditor();
    showPosts();
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    reader.onload({ target: { result: null } });
  }
}

function showPosts() {
  const posts = getPosts();
  const container = document.getElementById("posts");
  const searchText = document.getElementById("searchInput").value.trim().toLowerCase();

  container.innerHTML = "";

  const visiblePosts = posts
    .map((post, index) => ({ post, index }))
    .reverse()
    .filter(({ post }) => (post.text || "").toLowerCase().includes(searchText));

  if (visiblePosts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = posts.length === 0 ? "게시물이 없습니다" : "일치하는 게시물이 없습니다";
    container.appendChild(empty);
    return;
  }

  visiblePosts.forEach(({ post, index }) => {
    const div = document.createElement("div");
    div.className = "post";
    div.onclick = () => openCardViewer(post);

    if (isAdmin) {
      div.appendChild(createDeleteButton(index));
    }

    const text = document.createElement("p");
    text.textContent = post.text || "";
    div.appendChild(text);

    if (post.image) {
      const img = document.createElement("img");
      img.src = post.image;
      img.alt = "Post image";
      div.appendChild(img);
    }

    container.appendChild(div);

    setTimeout(() => {
      div.classList.add("show");
    }, 10);
  });
}

function createDeleteButton(index) {
  const button = document.createElement("button");
  button.className = "deleteBtn";
  button.setAttribute("aria-label", "Delete post");
  button.onclick = function(event) {
    event.stopPropagation();
    deletePost(index, button);
  };

  button.innerHTML = `
    <svg viewBox="0 0 24 28" aria-hidden="true">
      <path d="M3 7h18"></path>
      <path d="M8 7V4h8v3"></path>
      <path d="M6 10l1 15h10l1-15"></path>
      <path d="M10 13v8"></path>
      <path d="M14 13v8"></path>
    </svg>
  `;

  return button;
}

function deletePost(index, button) {
  if (!isAdmin) {
    alert("Only admin can delete posts");
    return;
  }

  const postEl = button.closest(".post");
  postEl.classList.add("removing");

  setTimeout(() => {
    const posts = getPosts();
    posts.splice(index, 1);
    savePosts(posts);
    showPosts();
  }, 300);
}

function openModal() {
  document.getElementById("loginModal").classList.add("show");
}

function closeModal() {
  document.getElementById("loginModal").classList.remove("show");
}

function openCardViewer(post) {
  const viewer = document.getElementById("cardViewer");
  const content = document.querySelector(".card-viewer-content");

  content.innerHTML = "";

  const closeButton = document.createElement("button");
  closeButton.className = "viewer-close";
  closeButton.textContent = "Close";
  closeButton.onclick = closeCardViewer;
  content.appendChild(closeButton);

  if (post.image) {
    const img = document.createElement("img");
    img.src = post.image;
    img.alt = "Expanded post image";
    content.appendChild(img);
  }

  const text = document.createElement("p");
  text.textContent = post.text || "";
  content.appendChild(text);

  viewer.classList.add("show");
}

function closeCardViewer() {
  document.getElementById("cardViewer").classList.remove("show");
}
