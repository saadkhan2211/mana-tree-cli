#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import path from "path";
import axios from "axios";
import inquirer from "inquirer";
import ora from "ora";
import Conf from "conf";
import { generateArchiveCore } from "../core/generateArchive.core";

const API_BASE_URL =
  process.env.URL || "https://mana-tree-server.onrender.com/api";

const program = new Command();
const config = new Conf({ projectName: "mana-tree" });

program.name("mt").description("Mana-Tree Project Generator").version("1.0.0");

program
  .command("create")
  .requiredOption("--project <name>")
  .requiredOption("--file <structure>")
  .option("--out <output>")
  .description("Generate project locally")
  .action(async (opts) => {
    const spinner = ora("Generating project...").start();

    try {
      const filePath = path.resolve(process.cwd(), opts.file);

      if (!fs.existsSync(filePath)) {
        spinner.fail("Structure file not found");
        process.exit(1);
      }

      const structureText = await fs.promises.readFile(filePath, "utf-8");

      const outputZipPath = opts.out
        ? path.resolve(process.cwd(), opts.out)
        : path.resolve(process.cwd(), `${opts.project}.zip`);

      const result = await generateArchiveCore({
        projectName: opts.project,
        structureText,
        outputZipPath,
      });

      spinner.succeed("Project created");

      console.log(`
🌳 ManaTree Generated Successfully!

Project : ${result.projectName}
Folders : ${result.folderCount}
Files   : ${result.fileCount}
Output  : ${result.zipPath}
`);
    } catch (error: any) {
      spinner.fail("Failed to generate project");
      console.error(error.message);
      process.exit(1);
    }
  });

program
  .command("login")
  .description("Login to your Mana-Tree account")
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: "input", name: "email", message: "Email:" },
      { type: "password", name: "password", message: "Password:" },
    ]);

    const spinner = ora("Logging in...").start();

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: answers.email,
        password: answers.password,
      });

      const { accessToken, user } = res.data;

      config.set("authToken", accessToken);
      config.set("user", user);

      spinner.succeed(`Logged in as ${user.email}`);
    } catch (err: any) {
      spinner.fail("Login failed");
      console.error("Invalid credentials.");
      process.exit(1);
    }
  });

program
  .command("logout")
  .description("Logout from Mana-Tree")
  .action(() => {
    config.delete("authToken");
    config.delete("user");
    console.log("Logged out successfully.");
  });

program
  .command("list")
  .description("List your saved projects")
  .action(async () => {
    const token = config.get("authToken");

    if (!token) {
      console.log("❌ Please login first using: mt login");
      process.exit(1);
    }

    const spinner = ora("Fetching your projects...").start();

    try {
      const res = await axios.get(`${API_BASE_URL}/generations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      spinner.stop();

      const items = res.data.items;

      if (!items.length) {
        console.log("No saved projects found.");
        return;
      }

      console.log("\nYour Projects:\n");

      items.forEach((item: any) => {
        console.log(
          `• ${item.project} (${item.files} files) - ${
            item.active ? "Active" : "Expired"
          }`,
        );
      });

      console.log("");
    } catch (err) {
      spinner.fail("Failed to fetch projects");
      process.exit(1);
    }
  });

program
  .argument("[projectName]")
  .option("-d, --download", "Download existing project")
  .action(async (projectName, options) => {
    if (!options.download) return;

    if (!projectName) {
      console.log("❌ Please provide project name: mt -d <projectName>");
      process.exit(1);
    }

    const token = config.get("authToken");

    if (!token) {
      console.log("❌ Please login first using: mt login");
      process.exit(1);
    }

    const spinner = ora("Fetching project list...").start();

    try {
      const listRes = await axios.get(`${API_BASE_URL}/generations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const project = listRes.data.items.find(
        (p: any) => p.project === projectName && p.active,
      );

      if (!project) {
        spinner.fail("Project not found or expired");
        process.exit(1);
      }

      spinner.text = "Downloading project...";

      const downloadRes = await axios.get(
        `${API_BASE_URL}/download/${project.id}`,
        {
          responseType: "arraybuffer",
        },
      );

      const outputPath = path.resolve(process.cwd(), `${projectName}.zip`);

      fs.writeFileSync(outputPath, downloadRes.data);

      spinner.succeed("Download complete!");
      console.log(`Saved to: ${outputPath}`);
    } catch (err) {
      spinner.fail("Download failed");
      process.exit(1);
    }
  });

program.parse(process.argv);
