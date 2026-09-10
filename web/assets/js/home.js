/* ============================================================
   Zafar — dashboard overview (home.html)
   Pulls today's quota + the local download history and turns them into
   an at-a-glance start screen, plus shortcuts into each section.
   ============================================================ */

(function () {
  var svg = ZafarShell.svg;

  var SHORTCUTS = [
    { icon: "file",  title: "MSCE past papers", text: "MANEB senior papers by subject and year", href: "dashboard.html?category=MSCE%20Maneb" },
    { icon: "file",  title: "JCE past papers",  text: "Junior certificate papers and mocks",      href: "dashboard.html?category=JCE%20Maneb" },
    { icon: "book",  title: "Textbooks",        text: "Senior and junior secondary textbooks",    href: "books.html" },
    { icon: "notes", title: "Summary notes",    text: "Condensed revision notes per subject",     href: "notes.html" },
    { icon: "check", title: "Marking keys",     text: "Check your answers against the scheme",    href: "marking-keys.html" },
    { icon: "heart", title: "Your favorites",   text: "Everything you saved for later",           href: "favorites.html" },
  ];

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function statCard(o) {
    return (
      '<div class="stat">' +
        '<div class="stat-head"><span class="stat-glyph">' + svg(o.icon, 17) + "</span>" +
        '<span class="stat-label">' + o.label + "</span></div>" +
        '<div class="stat-value" data-stat="' + o.key + '">' + (o.value == null ? "—" : o.value) + "</div>" +
        (o.meter ? '<div class="meter" data-meter="' + o.key + '"><i style="width:0%"></i></div>' : "") +
        '<div class="stat-foot" data-stat-foot="' + o.key + '">' + (o.foot || "") + "</div>" +
      "</div>"
    );
  }

  function render(shell) {
    var recent = Zafar.getRecentDownloads(6);

    shell.content.innerHTML =
      '<section class="hero">' +
        "<div><h2>" + greeting() + ", " + Zafar.escapeHTML(Zafar.username()) + "</h2>" +
        "<p>Every MANEB past paper, textbook, note and marking key in one place. " +
        "Pick up where you left off, or jump straight into a subject.</p></div>" +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary" href="dashboard.html">' + svg("file", 16) + "Browse past papers</a>" +
          '<a class="btn btn-ghost" href="favorites.html">' + svg("heart", 16) + "Your favorites</a>" +
        "</div>" +
      "</section>" +

      '<div class="row"><span class="badge badge-warn" data-demo-tag style="display:none">Demo data</span></div>' +

      '<div class="grid grid-stats">' +
        statCard({ key: "papers", icon: "bolt", label: "Paper downloads left", value: "…", meter: true, foot: "Resets at midnight" }) +
        statCard({ key: "books", icon: "book", label: "Book downloads left", value: "…", meter: true, foot: "Resets at midnight" }) +
        statCard({ key: "today", icon: "download", label: "Downloaded today", value: Zafar.getDownloadsToday(), foot: "On this device" }) +
        statCard({ key: "saved", icon: "heart", label: "Saved favorites", value: Zafar.getBookmarks().length, foot: "Across all sections" }) +
      "</div>" +

      '<section class="stack">' +
        '<div class="section-head"><h2>Jump back in</h2><p>Shortcuts to the sections students open most.</p></div>' +
        '<div class="grid">' +
          SHORTCUTS.map(function (s) {
            return (
              '<a class="panel feature" href="' + s.href + '">' +
                '<span class="stat-glyph">' + svg(s.icon, 18) + "</span>" +
                "<h3>" + s.title + "</h3><p>" + s.text + "</p>" +
              "</a>"
            );
          }).join("") +
        "</div>" +
      "</section>" +

      '<section class="stack">' +
        '<div class="section-head"><h2>Recent downloads</h2>' +
        '<p>Kept on this device so you can find a file again fast.</p></div>' +
        (recent.length
          ? '<div class="panel list">' + recent.map(function (d) {
              return (
                '<div class="list-row">' +
                  '<span class="file-glyph">' + svg("file", 17) + "</span>" +
                  '<span class="lines"><span class="name">' + Zafar.escapeHTML(d.name.replace(/\.pdf$/i, "")) +
                  '</span><span class="sub">' + Zafar.escapeHTML(d.category || "Document") + "</span></span>" +
                  '<span class="when">' + Zafar.timeAgo(d.at) + "</span>" +
                "</div>"
              );
            }).join("") + "</div>"
          : '<div class="state show">' + svg("clock", 40) +
            "<h3>No downloads yet</h3><p>Files you download will show up here for quick re-access.</p>" +
            '<a class="btn btn-primary btn-sm" href="dashboard.html">Find a past paper</a></div>') +
      "</section>";

    shell.count.textContent = "Overview";
  }

  function fillQuota(shell) {
    Zafar.authGet("/auth/quota")
      .then(function (q) {
        if (Zafar.isDemo()) ZafarShell.markDemo();
        [["papers", q.papers_left], ["books", q.books_left]].forEach(function (pair) {
          var key = pair[0], left = pair[1];
          var value = shell.content.querySelector('[data-stat="' + key + '"]');
          var meter = shell.content.querySelector('[data-meter="' + key + '"]');
          var foot = shell.content.querySelector('[data-stat-foot="' + key + '"]');
          if (left == null) { value.textContent = "—"; return; }
          value.textContent = left;
          var pct = Math.max(0, Math.min(100, (left / DAILY_PAPER_LIMIT) * 100));
          meter.querySelector("i").style.width = pct + "%";
          meter.classList.toggle("low", left > 0 && pct <= 30);
          meter.classList.toggle("out", left <= 0);
          foot.textContent = left <= 0 ? "Limit reached — resets at midnight" : "of " + DAILY_PAPER_LIMIT + " per day";
        });
      })
      .catch(function () {
        shell.content.querySelectorAll('[data-stat="papers"], [data-stat="books"]').forEach(function (n) {
          n.textContent = "—";
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var shell = ZafarShell.init({ active: "home", title: "Dashboard", crumb: "Overview" });
    if (!shell) return;
    render(shell);
    fillQuota(shell);
  });
})();
