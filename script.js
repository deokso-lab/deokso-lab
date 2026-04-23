let isAdmin = false;

// ✅ 페이지 로드 시 실행
window.onload = function() {
  showPosts();

  // 항상 숨기고 시작
  document.getElementById("editor").style.display = "none";
};

// ✅ 로그인
function login() {
  if (document.getElementById("pw").value === "1234") {
    isAdmin = true;

    const editor = document.getElementById("editor");
    editor.style.display = "block";
    editor.classList.add("active"); // ⭐ 여기 추가

    closeModal();
    showPosts();
  } else {
    alert("비밀번호 틀림");
  }
}

// ✅ 로그아웃
function logout() {
  isAdmin = false;

  document.getElementById("editor").style.display = "none";
  showPosts();
}

// ✅ 게시글 추가 (관리자만 가능)
function addPost() {
  if (!isAdmin) {
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

  posts.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "post";
    div.onclick = () => openCardViewer(div);

    div.innerHTML = `
    ${isAdmin ? `<button class="deleteBtn" onclick="event.stopPropagation(); deletePost(${index})">X</button>` : ""}
    <p>${p.text}</p>
    ${p.image ? `<img src="${p.image}">` : ""}
    `;

    container.appendChild(div);

    // ⭐ 애니메이션 트리거
    setTimeout(() => {
      div.classList.add("show");
    }, 10);
  });
}

// ✅ 게시글 삭제 (관리자만 가능)
function deletePost(index) {
  if (!isAdmin) {
    alert("관리자만 삭제 가능");
    return;
  }

  const container = document.getElementById("posts");
  const postEl = container.children[index];

  // 애니메이션 먼저 실행
  postEl.classList.add("removing");

  setTimeout(() => {
    let posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts.splice(index, 1);
    localStorage.setItem("posts", JSON.stringify(posts));
    showPosts();
  }, 300);
}

// ✅ 모달 열기
function openModal() {
  document.getElementById("loginModal").classList.add("show");
}

// ✅ 모달 닫기
function closeModal() {
  document.getElementById("loginModal").classList.remove("show");
}

function openCardViewer(element) {
  const viewer = document.getElementById("cardViewer");
  const content = document.querySelector(".card-viewer-content");

  content.innerHTML = element.innerHTML; // 카드 내용 복사
  viewer.classList.add("show");
}

function closeCardViewer() {
  document.getElementById("cardViewer").classList.remove("show");
}

setTimeout(() => {
  div.classList.add("show");

  const img = div.querySelector("img");
  if (img) img.classList.add("show");

}, 10);
