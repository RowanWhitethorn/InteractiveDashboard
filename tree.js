// tree.js
// Node.js >= 14
// Ejecuta: node tree.js
// Opcional: node tree.js --maxDepth=3 --root=. --extraIgnore=.turbo,.expo

const fs = require("fs");
const path = require("path");

const DEFAULT_IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".vercel",
  ".cache",
  ".idea",
  ".vscode",
  "coverage",
  ".turbo",
  ".expo",
  ".pnpm-store",
]);
const IGNORE_FILES = new Set([".DS_Store", "Thumbs.db"]);

const args = process.argv.slice(2).reduce((acc, curr) => {
  const [k, v] = curr.split("=");
  acc[k.replace(/^--/, "")] = v ?? true;
  return acc;
}, {});

// Parámetros CLI
const ROOT = path.resolve(args.root || ".");
const MAX_DEPTH = args.maxDepth ? Number(args.maxDepth) : Infinity;
const extraIgnore = (args.extraIgnore || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
for (const d of extraIgnore) DEFAULT_IGNORE_DIRS.add(d);

// Utils
const toKB = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const isSymlink = (stats) => stats.isSymbolicLink?.() || false;
const mtimeISO = (stats) => new Date(stats.mtimeMs).toISOString();
const extOf = (name) => {
  const ext = path.extname(name);
  return ext.startsWith(".") ? ext.slice(1) : "";
};

// Walk recursivo
function walk(dirPath, depth = 0) {
  let dirSize = 0;
  const children = [];

  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return { type: "directory", name: path.basename(dirPath), children: [], size: 0, depth };
  }

  // Filtrar ignorados
  entries = entries.filter((ent) => {
    if (ent.isDirectory() && DEFAULT_IGNORE_DIRS.has(ent.name)) return false;
    if (ent.isFile() && IGNORE_FILES.has(ent.name)) return false;
    return true;
  });

  // Orden: carpetas primero, luego archivos, ambos alfabéticamente
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const ent of entries) {
    const full = path.join(dirPath, ent.name);
    let stats;
    try {
      stats = fs.lstatSync(full);
    } catch {
      continue;
    }

    // Evitar seguir symlinks (solo listamos el enlace)
    if (isSymlink(stats)) {
      children.push({
        type: "symlink",
        name: ent.name,
        path: path.relative(ROOT, full),
        depth,
      });
      continue;
    }

    if (ent.isDirectory()) {
      let child = {
        type: "directory",
        name: ent.name,
        children: [],
        size: 0,
        depth,
      };
      if (depth < MAX_DEPTH) {
        child = walk(full, depth + 1);
      }
      // recalcular nombre y depth por si retornó
      child.name = ent.name;
      child.depth = depth;
      dirSize += child.size || 0;
      children.push(child);
    } else if (ent.isFile()) {
      const fileSize = stats.size || 0;
      dirSize += fileSize;
      children.push({
        type: "file",
        name: ent.name,
        size: fileSize,
        size_kb: toKB(fileSize),
        ext: extOf(ent.name),
        mtime: mtimeISO(stats),
        depth,
      });
    }
  }

  return {
    type: "directory",
    name: path.basename(dirPath),
    path: path.relative(ROOT, dirPath) || ".",
    size: dirSize,
    size_kb: toKB(dirSize),
    children,
    depth,
  };
}

// Render TXT tipo árbol con tamaños
function renderTree(node, indent = "") {
  let out = "";
  const isDir = node.type === "directory";
  const label =
    node.type === "directory"
      ? `📁 ${node.name}/  (${node.size_kb ?? 0} KB)`
      : node.type === "file"
      ? `📄 ${node.name}  (${node.size_kb ?? 0} KB)`
      : `🔗 ${node.name}`;

  out += `${indent}${label}\n`;
  if (isDir && Array.isArray(node.children)) {
    const nextIndent = indent + "  ";
    for (const child of node.children) {
      out += renderTree(child, nextIndent);
    }
  }
  return out;
}

// Ejecutar
const tree = walk(ROOT, 0);

// Salidas
const TXT_PATH = path.join(ROOT, "project_structure.txt");
const JSON_PATH = path.join(ROOT, "project_structure.json");

// TXT
fs.writeFileSync(TXT_PATH, renderTree(tree), "utf8");
// JSON
fs.writeFileSync(JSON_PATH, JSON.stringify(tree, null, 2), "utf8");

// Resumen rápido
function summarize(node, acc = { files: 0, dirs: 0, bytes: 0 }) {
  if (node.type === "file") {
    acc.files += 1;
    acc.bytes += node.size || 0;
  } else if (node.type === "directory") {
    acc.dirs += 1;
    for (const ch of node.children || []) summarize(ch, acc);
  }
  return acc;
}
const sum = summarize(tree);
console.log("✅ Estructura generada");
console.log(" -", path.relative(ROOT, TXT_PATH));
console.log(" -", path.relative(ROOT, JSON_PATH));
console.log(
  `📦 Resumen: ${sum.dirs} directorios, ${sum.files} archivos, ${toKB(sum.bytes)} KB totales`
);
console.log("ℹ️ Ignorados:", [...DEFAULT_IGNORE_DIRS].join(", ") || "(ninguno)");
