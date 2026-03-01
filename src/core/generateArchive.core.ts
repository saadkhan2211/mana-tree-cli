import fs from "fs";
import path from "path";
import os from "os";
import { parseStructure } from "../utils/parser";
import { zipDirectory } from "../utils/archiver";
import { safeName } from "../utils/safeName";

function writeStarterFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);

  let content = "";
  if ([".js", ".ts", ".jsx", ".tsx"].includes(ext)) content = `// ${base}\n`;
  else if (ext === ".json") content = `{\n  \n}\n`;
  else if (base === ".env") content = `# env vars\n`;

  fs.writeFileSync(filePath, content, { flag: "wx" });
}

export async function generateArchiveCore(input: {
  projectName: string;
  structureText: string;
  outputZipPath: string;
}) {
  const projectName = safeName(input.projectName);
  const items = parseStructure(input.structureText);

  const tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), "filegen-"));
  const projectDir = path.join(tmpBase, projectName);

  await fs.promises.mkdir(projectDir, { recursive: true });

  let folderCount = 0;
  let fileCount = 0;

  for (const it of items.filter((x) => x.type === "dir")) {
    const fullDir = path.join(projectDir, it.rel);

    if (!fullDir.startsWith(projectDir))
      throw new Error("Invalid path detected");

    await fs.promises.mkdir(fullDir, { recursive: true });
    folderCount++;
  }

  for (const it of items.filter((x) => x.type === "file")) {
    const full = path.join(projectDir, it.rel);

    if (!full.startsWith(projectDir)) throw new Error("Invalid path detected");

    await fs.promises.mkdir(path.dirname(full), { recursive: true });

    if (!fs.existsSync(full)) {
      writeStarterFile(full);
      fileCount++;
    }
  }

  await fs.promises.mkdir(path.dirname(input.outputZipPath), {
    recursive: true,
  });
  await zipDirectory(projectDir, input.outputZipPath);

  await fs.promises.rm(tmpBase, { recursive: true, force: true });

  return {
    projectName,
    fileCount,
    folderCount,
    zipPath: input.outputZipPath,
  };
}
