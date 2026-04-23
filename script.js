// ✅ 페이지 로드 시 실행
window.onload = function() {
  showPosts();

  if (localStorage.getItem("admin") === "true") {
    document.getElementById("editor").style.display = "block";
  }
};

// ✅ 로그인
function login() {
  if (document.getElementById("pw").value === "1234") {
    document.getElementById("editor").style.display = "block";
    closeModal();
    showPosts();
  } else {
    alert("비밀번호 틀림");
  }
}

// ✅ 로그아웃
function logout() {
  localStorage.removeItem("admin");
  document.getElementById("editor").style.display = "none";
  showPosts();
}

// ✅ 게시글 추가 (관리자만 가능)
function addPost() {
  if (localStorage.getItem("admin") !== "true") {
    alert("관리자만 작성 가능");
    return;
  }

  const text = document.getElementById("content").value;
  const file = document.getElementById("imageInput").files[0];

  if (!text && !file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const imgData = e.target.result;

    let posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts.push({ text: text, image: imgData });

    localStorage.setItem("posts", JSON.stringify(posts));

    document.getElementById("content").value = "";
    document.getElementById("imageInput").value = "";

    showPosts();
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    reader.onload({ target: { result: null } });
  }
}

// ✅ 게시글 표시
function showPosts() {
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const container = document.getElementById("posts");
  container.innerHTML = "";

  const isAdmin = localStorage.getItem("admin") === "true";

  posts.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      ${isAdmin ? `<button class="deleteBtn" onclick="deletePost(${index})">X</button>` : ""}
      <p>${p.text}</p>
      ${p.image ? `<img src="${p.image}">` : ""}
    `;

    container.appendChild(div);
  });
}

// ✅ 게시글 삭제 (관리자만 가능)
function deletePost(index) {
  if (localStorage.getItem("admin") !== "true") {
    alert("관리자만 삭제 가능");
    return;
  }

  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  posts.splice(index, 1);
  localStorage.setItem("posts", JSON.stringify(posts));
  showPosts();
}

// ✅ 모달 열기
function openModal() {
  document.getElementById("loginModal").classList.add("show");
}

// ✅ 모달 닫기
function closeModal() {
  document.getElementById("loginModal").classList.remove("show");
}
