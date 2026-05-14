/**
 * Validates NEWS_API_SOURCES / DEFAULT_NEWS_SOURCE_IDS in src/lib/newsSources.ts
 * without a TypeScript build (pure Node).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcPath = path.join(root, "src", "lib", "newsSources.ts");
const text = fs.readFileSync(srcPath, "utf8");

const main = text.indexOf("export const NEWS_API_SOURCES");
if (main === -1) {
  console.error("Could not find NEWS_API_SOURCES in newsSources.ts");
  process.exit(1);
}
const after = text.slice(main);
const end = after.indexOf("export const ALL_NEWS_SOURCE_IDS");
const block = end === -1 ? after : after.slice(0, end);

const ids = [...block.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) {
  console.error("Duplicate source ids:", [...new Set(dup)]);
  process.exit(1);
}

const defBlock = text.match(
  /export const DEFAULT_NEWS_SOURCE_IDS[^=]*=\s*\[([\s\S]*?)\]/
);
if (!defBlock) {
  console.error("Could not parse DEFAULT_NEWS_SOURCE_IDS");
  process.exit(1);
}
const defaults = [...defBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(ids);
for (const d of defaults) {
  if (!idSet.has(d)) {
    console.error(`Default id "${d}" is not in NEWS_API_SOURCES`);
    process.exit(1);
  }
}

console.log(
  `validate-news-sources: OK (${ids.length} sources, ${defaults.length} defaults)`
);
