(function () {
  "use strict";
  var C = window.SSKRON_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var state = { url: C.downloadUrl, latest: C.latestUrl || C.downloadUrl, name: C.fileName || "SSKron" };

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function showMsg(text, ok) {
    var m = $("msg"); m.textContent = text; m.className = "msg" + (ok ? " ok" : ""); m.hidden = false;
  }
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + " МБ" : Math.max(1, Math.round(b / 1024)) + " КБ"; }

  /* Заполнение страницы данными из config.js */
  function render() {
    $("description").textContent = C.description || "";
    $("version").textContent = C.version || "—";
    $("updated").textContent = C.updated || "—";
    $("size").textContent = C.size || "—";
    $("tgChannel").href = C.telegramChannel || "#";
    $("tgContact").href = C.telegramContact || "#";
    $("year").textContent = new Date().getFullYear();
    var icons = {
      crosshair: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
      scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
      bomb: '<path d="M10 4h4M12 4V2M9 7l-2-2M15 7l2-2"/><circle cx="12" cy="14" r="7"/><path d="M12 10v4l2 1"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4"/>',
      layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>'
    };
    $("featuresGrid").innerHTML = (C.features || []).map(function (f, i) {
      var icon = icons[f.icon] || icons.layers;
      return '<article class="feature-card" style="--card-index:' + i + '">' +
        '<div class="feature-icon"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></div>' +
        '<div class="feature-tag">SSKRON / FEATURE ' + String(i + 1).padStart(2, "0") + '</div>' +
        '<h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p>' +
        '<span class="feature-arrow" aria-hidden="true">↗</span></article>';
    }).join("");
    $("stepsList").innerHTML = (C.steps || []).map(function (s) {
      return "<li><div><strong>" + esc(s.title) + "</strong><span>" + esc(s.text) + "</span></div></li>";
    }).join("");
  }

  /* Авто-режим: данные из последнего релиза GitHub */
  function loadRelease() {
    if (!C.githubRepo) return Promise.resolve();
    return fetch("https://api.github.com/repos/" + C.githubRepo + "/releases/latest")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rel) {
        var a = rel.assets && rel.assets[0];
        $("version").textContent = rel.tag_name || rel.name || C.version;
        $("updated").textContent = new Date(rel.published_at).toLocaleDateString("ru-RU");
        if (a) {
          $("size").textContent = fmtSize(a.size);
          state.url = state.latest = a.browser_download_url;
          state.name = a.name;
        }
      })
      .catch(function () { /* оставляем значения из config.js */ });
  }

  function startDownload(url, name) {
    var a = document.createElement("a");
    a.href = url; a.download = name || ""; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* Реальное скачивание с проверкой наличия файла */
  function download(url) {
    $("msg").hidden = true;
    if (!url || /ВАШ_|НИК\/|example\.com/.test(url)) {
      showMsg("Ссылка на скачивание ещё не настроена. Укажите её в файле config.js.");
      return;
    }
    var abs = new URL(url, location.href);
    var same = abs.origin === location.origin;
    fetch(abs.href, { method: "HEAD", cache: "no-store" })
      .then(function (r) {
        if (r.status === 404 || (same && !r.ok)) {
          showMsg("Файл не найден. Возможно, он ещё не загружен или ссылка устарела. Напишите нам в Telegram.");
        } else {
          startDownload(abs.href, state.name); showMsg("Загрузка началась.", true);
        }
      })
      .catch(function () {
        /* Внешний сервер без CORS — проверить нельзя, просто открываем ссылку */
        if (same) showMsg("Не удалось получить файл. Проверьте подключение и повторите попытку.");
        else { startDownload(abs.href, state.name); showMsg("Загрузка началась.", true); }
      });
  }

  $("downloadBtn").addEventListener("click", function () { download(state.url); });
  $("latestBtn").addEventListener("click", function () { download(state.latest); });
  $("navDownload").addEventListener("click", function () {
    $("downloadBtn").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  render();
  loadRelease();
})();
