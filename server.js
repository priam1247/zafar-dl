/**
 * Zafar static dev server — zero dependencies, so the container boots
 * without an npm install (and without a network round-trip).
 * Serves ./web with no-cache headers, which is what you want while
 * iterating on plain HTML/CSS/JS.
 *
 *   PORT=4173 node server.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.join(__dirname, "web");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad request");
  }

  if (pathname === "/healthz") return send(res, 200, "ok");
  if (pathname.endsWith("/")) pathname += "index.html";
  // Bare paths like /home resolve to /home.html — nicer links, same files.
  if (!path.extname(pathname)) pathname += ".html";

  // Resolve inside ROOT only: blocks ../ traversal.
  const filePath = path.join(ROOT, path.normalize(pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, "<h1>404 — not found</h1><p><a href=\"/\">Back to Zafar</a></p>", TYPES[".html"]);
    }
    send(res, 200, data, TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Zafar frontend listening on http://${HOST}:${PORT}`);
});
