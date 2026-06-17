import dotenv from "dotenv";
import express from 'express';
import axios from 'axios';
import fs from 'fs';
import pLimit from 'p-limit';
import simpleGit from 'simple-git';
import os from 'os';
import path from 'path';

dotenv.config()
const app = express();
app.use(express.json());

const GITHUB_API = "https://api.github.com";

// Axios with token
const axiosInstance = axios.create({
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "config-scanner"
  }
});

// Config
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 2;
const MAX_FILES = 50;
const limit = pLimit(CONCURRENCY);

let SIGNATURES = [];

// Load signatures
try {
  const raw = fs.readFileSync(
  new URL("./signatures.json", import.meta.url),
  "utf-8"
);
  const parsed = JSON.parse(raw);

  SIGNATURES = parsed.signatures
    .map(sig => {
      try {
        const cleanedPattern = sig.pattern.replace(/\(\?i\)/g, "");
        return {
          name: sig.name,
          regex: new RegExp(cleanedPattern, "gi"),
          risk: sig.risk || "Unknown",
          severity: sig.severity || "medium"
        };
      } catch (err) {
        console.log(`❌ Skipping invalid regex: ${sig.name}`);
        return null;
      }
    })
    .filter(Boolean);

  console.log(`✅ Loaded ${SIGNATURES.length} signatures`);
} catch (err) {
  console.error("❌ Failed to load signatures:", err.message);
}

// Filters
const ALLOWED_EXT = [".js", ".ts", ".json", ".env", ".py"];
const IGNORE = ["node_modules", ".git", "dist", "build"];

// Helpers
function extractRepoDetails(repoUrl) {
  const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(\.git)?$/);
  if (!match) throw new Error("Invalid GitHub URL");

  return {
    owner: match[1],
    repo: match[2].replace(".git", "")
  };
}

function isIgnored(filePath) {
  return IGNORE.some(dir => filePath.includes(dir));
}

function shouldScan(file) {
  return (
    file.type === "blob" &&
    !isIgnored(file.path) &&
    ALLOWED_EXT.some(ext => file.path.endsWith(ext)) &&
    file.size < 100000
  );
}

// Clone repo
async function cloneRepo(repoUrl) {
  const tempDir = path.join(os.tmpdir(), `scan-${Date.now()}`);
  const git = simpleGit();
  await git.clone(repoUrl, tempDir);
  return tempDir;
}

// Recursively get files
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      if (!isIgnored(fullPath)) {
        results = results.concat(getAllFiles(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  });

  return results;
}

// Local scan
function scanLocalFiles(basePath, repoUrl) {
  const allFiles = getAllFiles(basePath);

  const validFiles = allFiles.filter(file =>
    ALLOWED_EXT.some(ext => file.endsWith(ext)) &&
    fs.statSync(file).size < 100000
  );

  const findings = [];

  validFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const sig of SIGNATURES) {
        const matches = line.match(sig.regex);

        if (matches) {
          findings.push({
            file: filePath.replace(basePath, ""),
            line: index + 1,
            value: matches[0],
            source: "full_scan",
            repo: repoUrl,
            secretType: sig.name,
            risk: sig.risk,
          });
        }
      }
    });
  });

  return {
    scannedFiles: validFiles.length,
    findings
  };
}

// Get diff
async function getDiff(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log({ maxCount: 2 });
  if (log.total < 2) return "";

  const latest = log.all[0].hash;
  const prev = log.all[1].hash;

  return await git.diff([prev, latest]);
}

// Scan diff
function scanDiff(diffText, repoUrl) {
  const findings = [];
  const lines = diffText.split("\n");

  lines.forEach((line, index) => {
    if (!line.startsWith("+")) return;

    for (const sig of SIGNATURES) {
      const match = line.match(sig.regex);
      if (match) {
        findings.push({
          type: sig.name,
          file: "diff",
          line: index + 1,
          value: match[0],
          source: "diff",
          repo: repoUrl,
          secretType: sig.name,
          risk: sig.risk,
        });
      }
    }
  });

  return findings;
}

// Delete repo
function deleteFolder(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

export const scanRepoService = async (repoUrl) => {
  const { owner, repo } = extractRepoDetails(repoUrl);

  const repoRes = await axiosInstance.get(
    `${GITHUB_API}/repos/${owner}/${repo}`
  );

  const branch = repoRes.data.default_branch;

  const treeRes = await axiosInstance.get(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  const files = treeRes.data.tree;
  const totalFiles = files.filter(f => f.type === "blob").length;

  const useApi = totalFiles < 7;

  let findings = [];
  let scannedFiles = 0;

  if (useApi) {
    console.log("⚡ Using API scanning");

    const validFiles = files.filter(shouldScan).slice(0, MAX_FILES);

    await Promise.all(
      validFiles.map(file =>
        limit(async () => {
          try {
            await new Promise(r => setTimeout(r, 150));

            const res = await axiosInstance.get(
              `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`
            );

            if (!res.data.content) return;

            const content = Buffer.from(
              res.data.content,
              "base64"
            ).toString("utf-8");

            const lines = content.split("\n");

            lines.forEach((line, index) => {
              for (const sig of SIGNATURES) {
                const matches = line.match(sig.regex);

                if (matches) {
                  findings.push({
                    repo: repoUrl,
                    secretType: sig.name,
                    file: file.path,
                    line: index + 1,
                    value: matches[0],
                    risk: sig.risk,
                    source: "api"
                  });
                }
              }
            });
          } catch {}
        })
      )
    );

    scannedFiles = validFiles.length;

  } else {
    console.log("🐙 Using CLONE scanning");

    const repoPath = await cloneRepo(repoUrl);

    const result = scanLocalFiles(repoPath, repoUrl);
    findings = result.findings;
    scannedFiles = result.scannedFiles;

    const diff = await getDiff(repoPath);
    const diffFindings = scanDiff(diff, repoUrl);
    findings.push(...diffFindings);

    deleteFolder(repoPath);
  }

  // dedupe (unchanged)
  const unique = new Set();
  findings = findings.filter(f => {
    const key = `${f.file}-${f.line}-${f.value}`;
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  });

  return {
    repo: `${owner}/${repo}`,
    findings,
    scannedFiles,
    mode: useApi ? "api" : "clone"
  };
};
