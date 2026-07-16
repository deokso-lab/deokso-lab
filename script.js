let equipments = [];
let activeCategory = "전체";

const search = document.getElementById("search");
const result = document.getElementById("result");
const stats = document.getElementById("stats");
const resultSummary = document.getElementById("resultSummary");
const filterButtons = document.querySelectorAll(".filter-button");

function renderMessage(message) {
  result.innerHTML = `<div class="empty-state">${message}</div>`;
}

function isReagent(item) {
  return item.category === "시약";
}

function formatQuantity(item) {
  if (item.quantity === undefined || item.quantity === null) {
    return "수량 정보 없음";
  }

  return isReagent(item) ? `${item.quantity}ml` : `${item.quantity}개`;
}

function countByCategory(category) {
  return equipments.filter((item) => item.category === category).length;
}

function renderStats() {
  const statItems = [
    ["전체 항목", equipments.length],
    ["실험기구", countByCategory("실험기구")],
    ["측정기기", countByCategory("측정기기")],
    ["주의 시약", countByCategory("시약"), "warning"],
  ];

  stats.innerHTML = statItems
    .map(
      ([label, value, tone]) => `
        <div class="stat-card ${tone || ""}">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function getFilteredItems() {
  const keyword = search.value.trim().toLowerCase();

  return equipments.filter((item) => {
    const matchesCategory =
      activeCategory === "전체" || item.category === activeCategory;
    const matchesKeyword =
      keyword === "" ||
      item.name.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword);

    return matchesCategory && matchesKeyword;
  });
}

function renderSummary(items) {
  const keyword = search.value.trim();
  const categoryLabel =
    activeCategory === "전체" ? "전체 카테고리" : activeCategory;

  resultSummary.textContent = keyword
    ? `${categoryLabel}에서 "${keyword}" 검색 결과 ${items.length}개`
    : `${categoryLabel} 항목 ${items.length}개`;
}

function renderItems(items) {
  result.innerHTML = items
    .map((item) => {
      const reagent = isReagent(item);
      const others = equipments.filter(
        (equipment) =>
          equipment.location === item.location && equipment.name !== item.name
      );

      return `
        <article class="card ${reagent ? "reagent-card" : ""}">
          <div class="card-header">
            <div class="title-group">
              <h2>${item.name}</h2>
              ${reagent ? `<span class="danger-badge">주의 필요</span>` : ""}
            </div>
            <span class="quantity">${formatQuantity(item)}</span>
          </div>

          <div class="meta">
            <span>${item.category}</span>
            <span>${item.location}</span>
          </div>

          <p class="description">${item.description}</p>

          ${
            reagent && item.precautions
              ? `
                <div class="precautions">
                  <strong>주의사항</strong>
                  <p>${item.precautions}</p>
                </div>
              `
              : ""
          }

          <div class="nearby">
            <h3>같은 위치</h3>
            <div class="other">
              ${
                others.length
                  ? others.map((other) => `<div class="item">${other.name}</div>`).join("")
                  : `<div class="item muted">없음</div>`
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateView() {
  const items = getFilteredItems();

  renderSummary(items);

  if (!items.length) {
    renderMessage("조건에 맞는 항목이 없습니다.");
    return;
  }

  renderItems(items);
}

fetch("data/equipment.json")
  .then((res) => res.json())
  .then((data) => {
    equipments = data;
    renderStats();
    updateView();
  })
  .catch(() => {
    resultSummary.textContent = "장비 목록을 불러오지 못했습니다.";
    renderMessage("장비 목록을 불러오지 못했습니다.");
  });

search.addEventListener("input", updateView);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    updateView();
  });
});
