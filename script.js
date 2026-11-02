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
    $("featuresGrid").innerHTML = (C.features || []).map(function (f) {
      return '<div class="card"><h3>' + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div>";
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
