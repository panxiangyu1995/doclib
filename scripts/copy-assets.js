import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const Q28_WASM_GRAMMARS = [
  "tree-sitter-typescript.wasm",
  "tree-sitter-tsx.wasm",
  "tree-sitter-javascript.wasm",
  "tree-sitter-python.wasm",
  "tree-sitter-go.wasm",
  "tree-sitter-rust.wasm",
  "tree-sitter-java.wasm",
  "tree-sitter-kotlin.wasm",
  "tree-sitter-c_sharp.wasm",
  "tree-sitter-ruby.wasm",
  "tree-sitter-php.wasm",
  "tree-sitter-c.wasm",
  "tree-sitter-cpp.wasm",
];

async function copy(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copy(s, d);
    else await fs.copyFile(s, d);
  }
}

await copy(path.join(root, "assets"), path.join(root, "dist", "assets"));
await copy(path.join(root, "skills"), path.join(root, "dist", "assets", "skills"));

const vendorSrc = path.join(root, "vendor", "codegraph", "src");
await fs.mkdir(path.join(root, "dist", "vendor"), { recursive: true });
await fs.writeFile(path.join(root, "dist", "vendor", "package.json"), `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`, "utf8");
await fs.copyFile(path.join(vendorSrc, "db", "schema.sql"), path.join(root, "dist", "vendor", "db", "schema.sql"));
const wasmDest = path.join(root, "dist", "vendor", "extraction", "wasm");
await fs.mkdir(wasmDest, { recursive: true });
for (const file of Q28_WASM_GRAMMARS) {
  await fs.copyFile(path.join(vendorSrc, "extraction", "wasm", file), path.join(wasmDest, file));
}

console.log("assets copied: templates + guides + skills + vendor(schema.sql + 13 wasm grammars)");
