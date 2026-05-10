let isAdmin = false;
let adminPassword = "";

window.onload = function() {
  setupAdminButtonFade();
  setupFileNamePreview();
  setupBackupImport();
  setupSearch();
  updateAdminUI();
  showPosts();

  document.getElementById("editor").style.display = "none";
};

function updateAdminUI() {
  const status = document.getElementById("adminStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminBtn = document.getElementById("adminBtn");

  if (isAdmin) {
    status.textContent = "관리자 상태: 로그인됨";
    logoutBtn.style.display = "inline-block";
    adminBtn.style.display = "none";
  } else {
    status.textContent = "관리자 상태: 로그아웃";
    logoutBtn.style.display = "none";
    adminBtn.style.display = "inline-block";
  }
}

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

async function getPosts() {
  const response = await fetch("/posts");
  if (!response.ok) {
    throw new Error("Failed to load posts from server.");
  }
  return response.json();
}

async function savePost(post) {
  const response = await fetch("/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword
    },
    body: JSON.stringify(post)
  });

  if (!response.ok) {
    throw new Error("Failed to save post to server.");
  }

  return response.json();
}

async function importPosts(posts) {
  const response = await fetch("/posts/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword
    },
    body: JSON.stringify({ posts })
  });

  if (!response.ok) {
    throw new Error("Failed to import posts.");
  }

  return response.json();
}

function resetEditor() {
  document.getElementById("content").value = "";
  document.getElementById("imageInput").value = "";
  document.getElementById("fileName").textContent = "선택된 파일 없음";
  document.getElementById("imagePreview").innerHTML = "";
}

function setupBackupImport() {
  const backupInput = document.getElementById("backupInput");

  backupInput.addEventListener("change", function() {
    const file = backupInput.files[0];
    if (!file) return;

    restorePostsFromBackup(file).finally(() => {
      backupInput.value = "";
    });
  });
}

async function exportPosts() {
  if (!isAdmin) {
    alert("관리자만 백업을 다운로드할 수 있습니다");
    return;
  }

  try {
    const posts = await getPosts();
    const backup = {
      exportedAt: new Date().toISOString(),
      posts
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `deokso-lab-posts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    alert("백업 다운로드에 실패했습니다.");
    console.error(error);
  }
}

async function restorePostsFromBackup(file) {
  if (!isAdmin) {
    alert("관리자만 백업을 복원할 수 있습니다");
    return;
  }

  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    const posts = Array.isArray(backup) ? backup : backup.posts;

    if (!Array.isArray(posts)) {
      alert("올바른 백업 파일이 아닙니다.");
      return;
    }

    const confirmed = confirm(
      `현재 게시글이 백업 파일의 게시글 ${posts.length}개로 교체됩니다. 계속할까요?`
    );

    if (!confirmed) return;

    const result = await importPosts(posts);
    alert(`백업 복원이 완료되었습니다. 게시글 ${result.count}개를 불러왔습니다.`);
    showPosts();
  } catch (error) {
    alert("백업 복원에 실패했습니다. JSON 파일을 확인해 주세요.");
    console.error(error);
  }
}

async function login() {
  const password = document.getElementById("pw").value;

  try {
    const response = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      throw new Error("Invalid password.");
    }
    isAdmin = true;
    adminPassword = password;

    const editor = document.getElementById("editor");
    editor.style.display = "block";
    editor.classList.add("active");

    closeModal();
    updateAdminUI();
    showPosts();
  } catch (error) {
    alert("비밀번호가 틀렸습니다");
  }
}

function logout() {
  isAdmin = false;
  adminPassword = "";

  document.getElementById("editor").style.display = "none";
  updateAdminUI();
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

  reader.onload = async function(e) {
    try {
      await savePost({
        text: text,
        image: e.target.result,
        createdAt: Date.now()
      });
      resetEditor();
      showPosts();
    } catch (error) {
      alert("게시물 저장에 실패했습니다. 서버가 실행 중인지 확인하세요.");
      console.error(error);
    }
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    reader.onload({ target: { result: null } });
  }
}

async function showPosts() {
  const container = document.getElementById("posts");
  const searchText = document.getElementById("searchInput").value.trim().toLowerCase();
  container.innerHTML = "<div class='empty-state'>로딩 중...</div>";

  try {
    const posts = await getPosts();
    container.innerHTML = "";

    const visiblePosts = posts
      .slice()
      .reverse()
      .filter((post) => (post.text || "").toLowerCase().includes(searchText));

    if (visiblePosts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = posts.length === 0 ? "게시물이 없습니다" : "일치하는 게시물이 없습니다";
      container.appendChild(empty);
      return;
    }

    visiblePosts.forEach((post) => {
      const div = document.createElement("div");
      div.className = "post";
      div.onclick = () => openCardViewer(post);

      if (isAdmin) {
        div.appendChild(createDeleteButton(post.id));
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
  } catch (error) {
    container.innerHTML = "<div class='empty-state'>서버에 연결할 수 없습니다. 서버를 실행하세요.</div>";
    console.error(error);
  }
}

function createDeleteButton(postId) {
  const button = document.createElement("button");
  button.className = "deleteBtn";
  button.setAttribute("aria-label", "Delete post");
  button.onclick = function(event) {
    event.stopPropagation();
    deletePost(postId, button);
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

async function deletePost(postId, button) {
  if (!isAdmin) {
    alert("Only admin can delete posts");
    return;
  }

  const postEl = button.closest(".post");
  postEl.classList.add("removing");

  setTimeout(async () => {
    try {
      const response = await fetch(`/posts/${postId}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      if (!response.ok) {
        throw new Error("Failed to delete post.");
      }
      showPosts();
    } catch (error) {
      alert("게시물 삭제에 실패했습니다.");
      console.error(error);
      postEl.classList.remove("removing");
    }
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
