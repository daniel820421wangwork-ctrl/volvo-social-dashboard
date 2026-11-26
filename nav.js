/*
  全站共用導覽列：每一頁上方顯示同一條選單，並標出這一頁屬於研究的哪一步、狀態、上一步／下一步
  - 頁面清單在下方 PAGES；步驟與狀態來自 progress_data.js（03_程式碼/dashboard/build_progress.py 的 STEPS）
  - 每頁只要在 </body> 前載入 progress_data.js 與 nav.js 即可，不需要其他設定
*/
(function () {
  const PAGES = [
    { href: "index.html", label: "研究進度", group: "首頁" },
    { href: "browse.html", label: "資料瀏覽", group: "資料" },
    { href: "review.html", label: "AI 試標檢查", group: "標註" },
    { href: "topic_map.html", label: "主題地圖", group: "分析" },
    { href: "trend.html", label: "議題趨勢", group: "分析" },
    { href: "discussion.html", label: "會議 1：中庸與反諷", group: "會議" },
    { href: "agenda.html", label: "會議 2：討論重點", group: "會議" },
  ];
  const STATUS = { done: "完成", doing: "進行中", todo: "未開始" };
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const D = window.PROGRESS_DATA;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const css = `
  .sitenav { position: sticky; top: 0; z-index: 20; background: var(--surface, #fcfcfb); border-bottom: 1px solid var(--border, #e2e1dc); font: 14px/1.5 "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif; }
  .sitenav .in { max-width: 1200px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; gap: 4px; min-height: 48px; }
  .sitenav .brand { font-weight: 600; color: var(--text, #0b0b0b); text-decoration: none; margin-right: 10px; white-space: nowrap; }
  .sitenav .links { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
  .sitenav .grp { color: var(--text-3, #7a7974); font-size: 12px; margin: 0 2px 0 10px; }
  .sitenav .grp:first-child { margin-left: 0; }
  .sitenav a.lk { color: var(--text-2, #52514e); text-decoration: none; padding: 5px 9px; border-radius: 7px; white-space: nowrap; }
  .sitenav a.lk:hover { color: var(--text, #0b0b0b); background: var(--surface-2, #f0efec); }
  .sitenav a.lk.on { color: var(--accent, #2a78d6); background: var(--accent-soft, rgba(42,120,214,.12)); font-weight: 600; }
  .sitenav .menu { display: none; margin-left: auto; font: inherit; font-size: 13px; border: 1px solid var(--border, #e2e1dc); background: var(--surface, #fcfcfb); color: var(--text-2, #52514e); border-radius: 8px; padding: 5px 12px; cursor: pointer; }
  .stepbar { border-bottom: 1px solid var(--border, #e2e1dc); background: var(--surface-2, #f0efec); font: 13px/1.5 "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif; color: var(--text-2, #52514e); }
  .stepbar .in { max-width: 1200px; margin: 0 auto; padding: 7px 16px; display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; }
  .stepbar .crumb { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
  .stepbar .crumb a { color: var(--text-2, #52514e); }
  .stepbar .crumb b { color: var(--text, #0b0b0b); font-weight: 600; }
  .stepbar .sp { flex: 1; }
  .stepbar .pv a { color: var(--accent, #2a78d6); text-decoration: none; white-space: nowrap; }
  .stepbar .pv a + a { margin-left: 14px; }
  .snpill { font-size: 12px; padding: 0 9px; border-radius: 999px; white-space: nowrap; }
  .snpill.done { background: var(--ok-bg, #e3f3e3); color: var(--ok, #0f7a0f); }
  .snpill.doing { background: var(--doing-bg, #fbefd6); color: var(--doing, #8a5a00); }
  .snpill.todo { background: var(--todo-bg, #ecebe7); color: var(--todo, #6b6a65); }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .snpill.done { background: #16301a; color: #7fd17f; } :root:not([data-theme="light"]) .snpill.doing { background: #3a2c10; color: #f2c066; } :root:not([data-theme="light"]) .snpill.todo { background: #262624; color: #a8a79f; } }
  :root[data-theme="dark"] .snpill.done { background: #16301a; color: #7fd17f; } :root[data-theme="dark"] .snpill.doing { background: #3a2c10; color: #f2c066; } :root[data-theme="dark"] .snpill.todo { background: #262624; color: #a8a79f; }
  @media (max-width: 860px) {
    .sitenav .menu { display: inline-block; }
    .sitenav .links { display: none; position: absolute; left: 0; right: 0; top: 100%; background: var(--surface, #fcfcfb); border-bottom: 1px solid var(--border, #e2e1dc); padding: 8px 12px 12px; flex-direction: column; align-items: stretch; gap: 0; box-shadow: 0 8px 18px rgba(0,0,0,.08); }
    .sitenav.open .links { display: flex; }
    .sitenav .grp { margin: 8px 0 2px; }
    .sitenav a.lk { padding: 7px 10px; }
  }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // 選單
  let links = "", last = "";
  PAGES.forEach((p) => {
    if (p.group !== last) { links += `<span class="grp">${esc(p.group)}</span>`; last = p.group; }
    links += `<a class="lk${p.href === file ? " on" : ""}" href="${p.href}">${esc(p.label)}</a>`;
  });
  const nav = document.createElement("nav");
  nav.className = "sitenav";
  nav.setAttribute("aria-label", "全站導覽");
  nav.innerHTML = `<div class="in"><a class="brand" href="index.html">Volvo 論文</a><div class="links">${links}</div><button class="menu" type="button" aria-expanded="false">選單</button></div>`;
  const btn = nav.querySelector(".menu");
  btn.addEventListener("click", () => { const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", open); });

  // 這一頁屬於哪個步驟：找 pages 裡網址（不含 #）等於本頁的步驟，沒有錨點的優先
  let bar = null;
  if (D && D.steps && file !== "index.html") {
    const flat = [];
    D.steps.forEach((s) => s.items.forEach((it) => { if (it.pages && it.pages.length) flat.push({ stage: s.stage, ...it }); }));
    const hits = flat.filter((it) => it.pages.some((p) => p.href.split("#")[0] === file));
    hits.sort((a, b) => (a.pages.some((p) => p.href === file) ? 0 : 1) - (b.pages.some((p) => p.href === file) ? 0 : 1));
    const cur = hits[0];
    if (cur) {
      const i = flat.indexOf(cur), prev = flat[i - 1], next = flat[i + 1];
      const go = (it, arrow) => `<a href="${it.pages[0].href}" title="${esc(it.stage)}">${arrow === "←" ? "← " : ""}${esc(it.id)} ${esc(it.name.length > 14 ? it.name.slice(0, 13) + "…" : it.name)}${arrow === "→" ? " →" : ""}</a>`;
      const others = hits.slice(1).map((it) => `<span>・也屬於 ${esc(it.id)}</span>`).join("");
      bar = document.createElement("div");
      bar.className = "stepbar";
      bar.innerHTML = `<div class="in"><div class="crumb"><a href="index.html#steps">${esc(cur.stage)}</a><span>›</span><b>${esc(cur.id)} ${esc(cur.name)}</b><span class="snpill ${cur.status}">${STATUS[cur.status]}</span>${others}</div><span class="sp"></span><div class="pv">${prev ? go(prev, "←") : ""}${next ? go(next, "→") : ""}</div></div>`;
    }
  }
  document.body.insertBefore(nav, document.body.firstChild);
  if (bar) nav.insertAdjacentElement("afterend", bar);
})();
