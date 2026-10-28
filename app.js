(() => {
  "use strict";

  const STORE_KEY = "menupick.v1";
  const UI_KEY = "menupick.ui.v1";
  const DAY = 24 * 60 * 60 * 1000;
  const $ = (s) => document.querySelector(s);

  // ---------- 저장소 ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function fromDefault(d) {
    return {
      id: uid(), name: d.name, cat: d.cat, tags: [...d.tags], visited: d.visited,
      memo: d.memo || "", rating: 0, fav: false, visits: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.items)) return data.items;
      }
    } catch (e) { /* 손상된 데이터는 기본값으로 */ }
    return DEFAULT_RESTAURANTS.map(fromDefault);
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ items })); }
    catch (e) { toast("저장 실패: 저장 공간을 확인하세요"); }
  }

  function loadUi() {
    try { return { mode: "all", cat: "", sort: "default", skipRecent: true, ...JSON.parse(localStorage.getItem(UI_KEY) || "{}") }; }
    catch (e) { return { mode: "all", cat: "", sort: "default", skipRecent: true }; }
  }
  function saveUi() {
    try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) {}
  }

  let items = load();
  const ui = loadUi();
  let query = "";

  // ---------- 유틸 ----------
  const lastVisit = (it) => (it.visits.length ? Math.max(...it.visits) : 0);
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const daysAgo = (t) => Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);

  function visitLabel(it) {
    const t = lastVisit(it);
    if (!t) return "";
    const n = daysAgo(t);
    return n === 0 ? "오늘 방문" : n === 1 ? "어제 방문" : `${n}일 전 방문`;
  }

  const mapUrl = (name) => "https://map.naver.com/p/search/" + encodeURIComponent("성수 " + name);
  const stars = (n) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  // ---------- 필터 ----------
  function filtered() {
    const q = query.trim().toLowerCase();
    let list = items.filter((it) => {
      if (ui.mode === "lunch" && !it.tags.includes("lunch")) return false;
      if (ui.mode === "dinner" && !it.tags.includes("dinner")) return false;
      if (ui.mode === "new" && it.visited) return false;
      if (ui.mode === "fav" && !it.fav) return false;
      if (ui.cat && it.cat !== ui.cat) return false;
      if (q && !(it.name.toLowerCase().includes(q) || it.memo.toLowerCase().includes(q))) return false;
      return true;
    });
    const byName = (a, b) => a.name.localeCompare(b.name, "ko");
    if (ui.sort === "name") list.sort(byName);
    else if (ui.sort === "rating") list.sort((a, b) => b.rating - a.rating || byName(a, b));
    else if (ui.sort === "recent") list.sort((a, b) => lastVisit(b) - lastVisit(a));
    else if (ui.sort === "old") list.sort((a, b) => lastVisit(a) - lastVisit(b));
    return list;
  }

  // ---------- 렌더 ----------
  function renderChips() {
    const counts = {};
    items.forEach((it) => (counts[it.cat] = (counts[it.cat] || 0) + 1));
    const cats = CATEGORIES.filter((c) => counts[c]);
    $("#catChips").innerHTML =
      `<button class="chip ${ui.cat ? "" : "on"}" data-cat="">전체</button>` +
      cats.map((c) => `<button class="chip ${ui.cat === c ? "on" : ""}" data-cat="${c}">${CAT_EMOJI[c]} ${c} ${counts[c]}</button>`).join("");
  }

  function renderList() {
    const list = filtered();
    $("#count").textContent = `${list.length}곳`;
    if (!list.length) {
      $("#list").innerHTML = `<li class="empty">조건에 맞는 가게가 없어요</li>`;
      return;
    }
    $("#list").innerHTML = list.map((it) => {
      const badges = [
        it.tags.includes("lunch") ? `<span class="badge lunch">점심</span>` : "",
        it.tags.includes("dinner") ? `<span class="badge dinner">회식</span>` : "",
        !it.visited ? `<span class="badge new">NEW</span>` : "",
      ].join("");
      const meta = [it.cat, it.rating ? `<span class="stars">${stars(it.rating)}</span>` : "", visitLabel(it), esc(it.memo)]
        .filter(Boolean).join(" · ");
      return `<li class="item" data-id="${it.id}">
        <span class="emoji">${CAT_EMOJI[it.cat] || "🍽️"}</span>
        <div class="body" data-act="edit">
          <div class="name">${esc(it.name)} ${badges}</div>
          <div class="meta">${meta}</div>
        </div>
        <div class="actions">
          <button data-act="fav" aria-label="즐겨찾기" class="${it.fav ? "" : "fav-off"}">⭐</button>
          <button data-act="visit" aria-label="오늘 방문 기록">✅</button>
          <a href="${mapUrl(it.name)}" target="_blank" rel="noopener" aria-label="네이버 지도">🗺️</a>
        </div>
      </li>`;
    }).join("");
  }

  function renderUi() {
    document.querySelectorAll("#modeSeg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === ui.mode));
    $("#sort").value = ui.sort;
    $("#skipRecent").checked = ui.skipRecent;
  }

  function render() { renderChips(); renderList(); }

  // ---------- 방문 기록 ----------
  function toggleVisitToday(it) {
    const today = startOfDay(Date.now());
    const idx = it.visits.findIndex((t) => startOfDay(t) === today);
    if (idx >= 0) {
      it.visits.splice(idx, 1);
      toast(`${it.name} 오늘 방문 기록 취소`);
    } else {
      it.visits.push(Date.now());
      it.visited = true;
      toast(`${it.name} 방문 기록 완료 👍`);
    }
    save(); render();
  }

  // ---------- 랜덤 뽑기 ----------
  let rolling = false;
  let lastPickId = null;

  function pick() {
    if (rolling) return;
    let pool = filtered();
    if (ui.skipRecent) {
      const recentCut = startOfDay(Date.now()) - 3 * DAY;
      const fresh = pool.filter((it) => lastVisit(it) < recentCut);
      if (fresh.length) pool = fresh;
    }
    if (pool.length > 1) pool = pool.filter((it) => it.id !== lastPickId);
    const box = $("#pickResult");
    if (!pool.length) {
      box.innerHTML = `<span class="pick-hint">뽑을 가게가 없어요. 필터를 바꿔보세요.</span>`;
      return;
    }
    // 별점 높은 곳에 약간의 가중치 (0점=1, 5점=2)
    const weights = pool.map((it) => 1 + it.rating / 5);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { chosen = pool[i]; break; } }

    rolling = true;
    const steps = 14;
    let i = 0;
    const tick = () => {
      if (i < steps) {
        const p = pool[Math.floor(Math.random() * pool.length)];
        box.innerHTML = `<div class="pick-name rolling">${esc(p.name)}</div>`;
        i++;
        setTimeout(tick, 40 + i * 12);
      } else {
        rolling = false;
        lastPickId = chosen.id;
        showPick(chosen);
        if (navigator.vibrate) navigator.vibrate(30);
      }
    };
    tick();
  }

  function showPick(it) {
    $("#pickResult").innerHTML = `
      <div class="pick-name">${CAT_EMOJI[it.cat] || ""} ${esc(it.name)}</div>
      <div class="pick-sub">${[it.cat, it.rating ? stars(it.rating) : "", visitLabel(it) || (it.visited ? "" : "아직 안 가본 곳"), esc(it.memo)].filter(Boolean).join(" · ")}</div>
      <div class="pick-links">
        <a href="${mapUrl(it.name)}" target="_blank" rel="noopener">🗺️ 지도</a>
        <button type="button" data-pick-visit="${it.id}">✅ 여기로 결정</button>
      </div>`;
  }

  // ---------- 편집 다이얼로그 ----------
  const dlg = $("#editDlg");
  const form = $("#editForm");
  let editing = null;
  let editRating = 0;

  form.cat.innerHTML = CATEGORIES.map((c) => `<option value="${c}">${CAT_EMOJI[c]} ${c}</option>`).join("");

  function renderStarsInput() {
    $("#starsInput").innerHTML = [1, 2, 3, 4, 5]
      .map((n) => `<button type="button" data-star="${n}" class="${n <= editRating ? "on" : ""}">★</button>`).join("");
  }

  function openEdit(it) {
    editing = it;
    $("#editTitle").textContent = it ? "가게 정보" : "가게 추가";
    form.name.value = it ? it.name : "";
    form.cat.value = it ? it.cat : "한식";
    form.lunch.checked = it ? it.tags.includes("lunch") : true;
    form.dinner.checked = it ? it.tags.includes("dinner") : false;
    form.visited.checked = it ? it.visited : false;
    form.memo.value = it ? it.memo : "";
    editRating = it ? it.rating : 0;
    renderStarsInput();
    $("#deleteBtn").hidden = !it;
    $("#visitInfo").textContent = it && it.visits.length
      ? `방문 ${it.visits.length}회 · 마지막 ${new Date(lastVisit(it)).toLocaleDateString("ko-KR")}`
      : "";
    dlg.showModal();
  }

  dlg.addEventListener("close", () => {
    if (dlg.returnValue !== "save") return;
    const name = form.name.value.trim();
    if (!name) return;
    const tags = [];
    if (form.lunch.checked) tags.push("lunch");
    if (form.dinner.checked) tags.push("dinner");
    const data = { name, cat: form.cat.value, tags, visited: form.visited.checked, memo: form.memo.value.trim(), rating: editRating };
    if (editing) {
      Object.assign(editing, data);
      toast("저장했어요");
    } else {
      items.unshift({ id: uid(), fav: false, visits: [], ...data });
      toast(`${name} 추가 완료`);
    }
    save(); render();
  });

  $("#starsInput").addEventListener("click", (e) => {
    const b = e.target.closest("[data-star]");
    if (!b) return;
    const n = +b.dataset.star;
    editRating = editRating === n ? 0 : n;
    renderStarsInput();
  });

  $("#deleteBtn").addEventListener("click", () => {
    if (!editing || !confirm(`'${editing.name}'을(를) 삭제할까요?`)) return;
    items = items.filter((x) => x !== editing);
    save(); render();
    dlg.close("deleted");
    toast("삭제했어요");
  });

  // ---------- 설정 ----------
  const sdlg = $("#settingsDlg");
  $("#settingsBtn").addEventListener("click", () => sdlg.showModal());

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ app: "menupick", version: 1, items }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `menupick-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.items)) throw new Error();
      items = data.items.filter((x) => x && x.name).map((x) => ({
        id: x.id || uid(), name: String(x.name), cat: CATEGORIES.includes(x.cat) ? x.cat : "기타",
        tags: Array.isArray(x.tags) ? x.tags : ["lunch"], visited: !!x.visited, memo: x.memo || "",
        rating: +x.rating || 0, fav: !!x.fav, visits: Array.isArray(x.visits) ? x.visits : [],
      }));
      save(); render(); sdlg.close();
      toast(`${items.length}곳 불러왔어요`);
    } catch (err) {
      toast("올바른 백업 파일이 아니에요");
    }
  });

  $("#mergeBtn").addEventListener("click", () => {
    const names = new Set(items.map((x) => x.name));
    const added = DEFAULT_RESTAURANTS.filter((d) => !names.has(d.name)).map(fromDefault);
    items.push(...added);
    save(); render(); sdlg.close();
    toast(added.length ? `${added.length}곳 추가했어요` : "추가할 새 가게가 없어요");
  });

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("별점·메모·방문 기록이 모두 지워집니다. 초기화할까요?")) return;
    items = DEFAULT_RESTAURANTS.map(fromDefault);
    save(); render(); sdlg.close();
    toast("초기화했어요");
  });

  // ---------- 이벤트 ----------
  $("#modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    ui.mode = b.dataset.mode;
    saveUi(); renderUi(); renderList();
  });

  $("#catChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    ui.cat = b.dataset.cat;
    saveUi(); render();
  });

  $("#search").addEventListener("input", (e) => { query = e.target.value; renderList(); });
  $("#sort").addEventListener("change", (e) => { ui.sort = e.target.value; saveUi(); renderList(); });
  $("#skipRecent").addEventListener("change", (e) => { ui.skipRecent = e.target.checked; saveUi(); });
  $("#pickBtn").addEventListener("click", pick);
  $("#addBtn").addEventListener("click", () => openEdit(null));

  $("#list").addEventListener("click", (e) => {
    const li = e.target.closest(".item");
    const act = e.target.closest("[data-act]");
    if (!li || !act) return;
    const it = items.find((x) => x.id === li.dataset.id);
    if (!it) return;
    if (act.dataset.act === "edit") openEdit(it);
    else if (act.dataset.act === "fav") { it.fav = !it.fav; save(); renderList(); }
    else if (act.dataset.act === "visit") toggleVisitToday(it);
  });

  $("#pickResult").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick-visit]");
    if (!b) return;
    const it = items.find((x) => x.id === b.dataset.pickVisit);
    if (it) { toggleVisitToday(it); showPick(it); }
  });

  // ---------- 시작 ----------
  renderUi();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
