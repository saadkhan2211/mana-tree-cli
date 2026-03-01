import path from "path";

type Item = { type: "dir" | "file"; rel: string };

function cleanName(raw: string) {
  const noComment = raw.split("#")[0];
  return noComment.replace(/[│├└─]/g, "").trim();
}

function detectRoot(lines: string[]) {
  const first = lines.find((l) => l.trim().length > 0);
  if (!first) return null;
  const t = first.trim();
  if (t.endsWith("/")) return t.replace(/\/+$/, "");
  return null;
}

function isProbablyTreeLine(line: string) {
  return /[├└│]──/.test(line);
}

function parseSlashStyle(lines: string[], root: string | null): Item[] {
  const items: Item[] = [];
  const stack: { indent: number; dirPath: string }[] = [];

  for (const line of lines) {
    const indent = (line.match(/^\s*/) || [""])[0].length;
    const name = cleanName(line);
    if (!name) continue;

    if (
      root &&
      line.trim().endsWith("/") &&
      name.replace(/\/+$/, "") === root
    ) {
      stack.length = 0;
      stack.push({ indent, dirPath: "" });
      continue;
    }

    const isDir = line.trim().endsWith("/") || name.endsWith("/");
    const clean = name.replace(/\/+$/, "");
    const hasLeadingSpaces = /^\s+/.test(line);

    if (!hasLeadingSpaces && clean.includes("/")) {
      items.push({ type: isDir ? "dir" : "file", rel: clean });
      continue;
    }

    while (stack.length && indent <= stack[stack.length - 1].indent)
      stack.pop();
    const parent = stack.length ? stack[stack.length - 1].dirPath : "";
    const rel = parent ? path.join(parent, clean) : clean;

    if (isDir) {
      items.push({ type: "dir", rel });
      stack.push({ indent, dirPath: rel });
    } else {
      items.push({ type: "file", rel });
    }
  }

  return items;
}

function parseTreeStyle(lines: string[], root: string | null): Item[] {
  const items: Item[] = [];
  const stack: string[] = [];
  let rootSkipped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!rootSkipped && trimmed.endsWith("/") && !trimmed.includes("──")) {
      const r = trimmed.replace(/\/+$/, "");
      if (root && r === root) {
        rootSkipped = true;
        stack.length = 0;
        stack[0] = "";
        continue;
      }
    }

    const prefix = line.split("──")[0] || "";
    const pipeCount = (prefix.match(/│/g) || []).length;
    const spaceCount = (prefix.match(/^\s*/) || [""])[0].length;
    const spaceDepth = Math.floor(spaceCount / 2);
    const depth = Math.max(pipeCount, spaceDepth);

    const name = cleanName(line);
    if (!name) continue;

    const isDir = trimmed.endsWith("/") || name.endsWith("/");
    const clean = name.replace(/\/+$/, "");

    const parent = stack[depth] ?? stack[depth - 1] ?? "";
    const rel = parent ? path.join(parent, clean) : clean;

    if (isDir) {
      items.push({ type: "dir", rel });
      stack[depth + 1] = rel;
    } else {
      items.push({ type: "file", rel });
    }
  }

  return items;
}

export function parseStructure(structureText: string): Item[] {
  const rawLines = structureText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "  "))
    .filter((l) => l.trim().length > 0);

  const root = detectRoot(rawLines);
  const treeMode = rawLines.some(isProbablyTreeLine);

  return treeMode
    ? parseTreeStyle(rawLines, root)
    : parseSlashStyle(rawLines, root);
}
