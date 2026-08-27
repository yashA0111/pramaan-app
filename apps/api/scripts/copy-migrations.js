const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../src/database/migrations");
const dest = path.resolve(__dirname, "../dist/database/migrations");

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`[build] Copied migrations from ${src} to ${dest}`);
}
