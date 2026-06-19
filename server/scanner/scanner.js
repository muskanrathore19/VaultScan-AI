import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import fs from "fs";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import os from "os";
import path from "path";

dotenv.config();

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

// =========================
// CONFIG
// =========================
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 2;
const MAX_FILES = 50;
const DIFF_DEPTH = 5;
const ENTROPY_THRESHOLD = 5;

const limit = pLimit(CONCURRENCY);

let SIGNATURES = [];

// =========================
// LOAD SIGNATURES
// =========================
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

// =========================
// FILTERS
// =========================
const ALLOWED_EXT = [".js", ".ts", ".json", ".env", ".py"];
const IGNORE = ["node_modules", ".git", "dist", "build"];
const ignoredFiles = [
  "package-lock.json",
  "package.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Cargo.lock",
  "poetry.lock",
  "Pipfile.lock",
  "go.sum",
  "go.mod",
  "Gemfile.lock"
];


// =========================
// HELPERS
// =========================
function extractRepoDetails(repoUrl) {
  const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(\.git)?$/);

  if (!match) throw new Error("Invalid GitHub URL");

  return {
    owner: match[1],
    repo: match[2].replace(".git", "")
  };
}

function isIgnored(filePath) {
  // return IGNORE.some(dir => filePath.includes(dir));
   return IGNORE.some(dir => filePath.includes(dir)) ||
    ignoredFiles.some(file => filePath.endsWith(file))
}

function shouldScan(file) {
  return (
    file.type === "blob" &&
    !isIgnored(file.path) &&
    ALLOWED_EXT.some(ext => file.path.endsWith(ext)) &&
    file.size < 100000
  );
}

// =========================
// SHANNON ENTROPY
// =========================
function calculateEntropy(str) {
  const map = {};

  for (const char of str) {
    map[char] = (map[char] || 0) + 1;
  }

  return Object.values(map).reduce((entropy, count) => {
    const p = count / str.length;
    return entropy - p * Math.log2(p);
  }, 0);
}

function detectHighEntropySecrets(line) {
  const findings = [];

  const candidates =
    line.match(/[A-Za-z0-9_\-\/+=]{20,}/g) || [];

  for (const candidate of candidates) {
    // ignore obvious false positives
    if (
      candidate.startsWith("http") ||
      candidate.includes("localhost") ||
      candidate.length > 300
    ) {
      continue;
    }

    const entropy = calculateEntropy(candidate);

    if (entropy >= ENTROPY_THRESHOLD) {
      findings.push({
        type: "High Entropy Secret",
        value: candidate,
        entropy: entropy.toFixed(2),
        risk: entropy > 7 ? "Medium" : "Low"
      });
    }
  }

  return findings;
}

// =========================
// CLONE REPO
// =========================
async function cloneRepo(repoUrl) {
  const tempDir = path.join(
    os.tmpdir(),
    `scan-${Date.now()}`
  );

  const git = simpleGit();

  await git.clone(repoUrl, tempDir);

  return tempDir;
}

// =========================
// RECURSIVE FILE FETCH
// =========================
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

// =========================
// LOCAL FILE SCAN
// =========================
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

      // =========================
      // REGEX SCAN
      // =========================
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
            severity: sig.severity
          });
        }
      }

      // =========================
      // ENTROPY SCAN
      // =========================
      const entropyFindings =
        detectHighEntropySecrets(line);

      entropyFindings.forEach(ent => {
        findings.push({
          repo: repoUrl,
          file: filePath.replace(basePath, ""),
          line: index + 1,
          value: ent.value,
          source: "entropy",
          secretType: ent.type,
          entropy: ent.entropy,
          risk: ent.risk
        });
      });

    });
  });

  return {
    scannedFiles: validFiles.length,
    findings
  };
}

// =========================
// LAST 5 COMMIT DIFFS
// =========================
async function getCommitDiffs(repoPath, depth = DIFF_DEPTH) {
  const git = simpleGit(repoPath);

  const log = await git.log({
    maxCount: depth + 1
  });

  const commits = log.all;

  const diffs = [];

  for (let i = 0; i < commits.length - 1; i++) {
    const newer = commits[i].hash;
    const older = commits[i + 1].hash;

    const diff = await git.diff([older, newer]);

    diffs.push({
      from: older,
      to: newer,
      diff
    });
  }

  return diffs;
}

// =========================
// SCAN DIFFS
// =========================
function scanDiff(diffText, repoUrl, commitInfo = {}) {
  const findings = [];

  const lines = diffText.split("\n");

  lines.forEach((line, index) => {
    if (!line.startsWith("+")) return;

    // =========================
    // REGEX
    // =========================
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
          commit: commitInfo
        });
      }
    }

    // =========================
    // ENTROPY
    // =========================
    const entropyFindings =
      detectHighEntropySecrets(line);

    entropyFindings.forEach(ent => {
      findings.push({
        file: "diff",
        line: index + 1,
        value: ent.value,
        source: "diff_entropy",
        repo: repoUrl,
        secretType: ent.type,
        entropy: ent.entropy,
        risk: ent.risk,
        commit: commitInfo
      });
    });

  });

  return findings;
}

// =========================
// GROQ AI REVIEW
// =========================
async function runGroqSecurityReview(findings) {
  try {

    if (!findings.length) {
      return {
        summary: "No major security findings detected.",
        aiFindings: []
      };
    }

    const GROQ_API =
      "https://api.groq.com/openai/v1/chat/completions";

    const reducedFindings = findings
      .slice(0, 25)
      .map(f => ({
        file: f.file,
        line: f.line,
        type: f.secretType,
        risk: f.risk,
        value: String(f.value).slice(0, 100)
      }));

//     const prompt = `
// You are a Senior DevSecOps Security Auditor.

// Your Output should always follow this Example Format as:


// Analyze these findings.

// Tasks:
// 1. Detect security issues
// 2. Explain possible vulnerabilities
// 3. Suggest remediation
// 4. Assign severity
// 5. Mention OWASP/CWE mappings
// 6. Provide executive summary

// Findings:
// ${JSON.stringify(reducedFindings, null, 2)}
// `;

const exampleReport = ` **Security Audit Report**

### Task 1: Detect Security Issues

The provided findings indicate the presence of high entropy secrets in various files across the \`credsweeper\` project. High entropy secrets are values that have a high degree of randomness or unpredictability, which can be indicative of sensitive information such as encryption keys, authentication tokens, or passwords.

### Task 2: Explain Possible Vulnerabilities

The detected high entropy secrets may pose the following vulnerabilities:

* **Hardcoded sensitive information**: If the high entropy secrets are hardcoded in the code, it may lead to sensitive information being exposed, especially if the code is publicly accessible or shared with unauthorized parties.
* **Insecure storage**: If the high entropy secrets are stored insecurely, such as in plaintext or with weak encryption, it may allow unauthorized access to sensitive information.
* **Insufficient access control**: If access to the high entropy secrets is not properly restricted, it may allow unauthorized parties to access or exploit sensitive information.

### Task 3: Suggest Remediation

To remediate the detected high entropy secrets, the following steps can be taken:

* **Remove hardcoded sensitive information**: Remove any hardcoded sensitive information from the code and replace it with secure storage mechanisms, such as environment variables or secure configuration files.
* **Implement secure storage**: Store high entropy secrets securely, such as using encryption or secure token storage mechanisms.
* **Restrict access**: Restrict access to high entropy secrets to only authorized parties, using mechanisms such as access control lists or role-based access control.

### Task 4: Assign Severity

Based on the potential impact of the detected high entropy secrets, the severity of the issue is assigned as **High**.

### Task 5: Mention OWASP/CWE Mappings

The detected high entropy secrets can be mapped to the following OWASP and CWE vulnerabilities:

* **OWASP A6: Security Misconfiguration**: The presence of high entropy secrets in the code may indicate security misconfiguration, such as hardcoded sensitive information or insecure storage.
* **CWE-798: Use of Hard-coded Credentials**: The detection of high entropy secrets may indicate the use of hard-coded credentials, which can lead to sensitive information being exposed.
* **CWE-313: Cleartext Storage of Sensitive Information**: The storage of high entropy secrets in plaintext or with weak encryption may indicate cleartext storage of sensitive information.

### Task 6: Provide Executive Summary

**Executive Summary**

The security audit of the \`credsweeper\` project has detected high entropy secrets in various files, indicating potential security vulnerabilities. The presence of hardcoded sensitive information, insecure storage, and insufficient access control may lead to sensitive information being exposed or exploited. To remediate the issue, it is recommended to remove hardcoded sensitive information, implement secure storage, and restrict access to high entropy secrets. The severity of the issue is assigned as **High**, and the detected vulnerabilities can be mapped to OWASP A6, CWE-798, and CWE-313. It is essential to address these vulnerabilities to ensure the security and integrity of the \`credsweeper\` project.

`;

const prompt = `
Analyze the following security findings and generate a report using the exact format demonstrated in the example.

Tasks:
1. Detect Security Issues
2. Explain Possible Vulnerabilities
3. Suggest Remediation
4. Assign Severity
5. Mention OWASP/CWE Mappings
6. Provide Executive Summary

Example Format:

${exampleReport}

Findings:

${JSON.stringify(reducedFindings, null, 2)}
`;

    const response = await axios.post(
      GROQ_API,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              `You are a Senior DevSecOps Security Auditor.
              Your primary responsibility is to analyze security findings and generate professional security audit reports.
              STRICT OUTPUT RULES:

              - Follow the report format exactly as provided by the user.
              - Preserve all markdown formatting.
              - Use the exact heading hierarchy provided in the example.
              - Use "**Security Audit Report**" as the report title.
              - Use "### Task X: ..." headings exactly.
              - Use "*" for bullet points.
              - Always generate all six tasks.
              - Never skip sections.
              - Never use tables.
              - Never use code blocks.
              - Never add introductory text.
              - Never add concluding text outside the report.
              - Return only the report.
              - When examples are provided, mimic their structure, tone, and formatting exactly.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      summary:
        response.data.choices?.[0]?.message?.content
    };

  } catch (err) {
    console.error(
      "❌ Groq Review Failed:",
      err.message
    );

    return {
      summary: "Groq AI review failed."
    };
  }
}

// =========================
// DELETE REPO
// =========================
function deleteFolder(dirPath) {
  fs.rmSync(dirPath, {
    recursive: true,
    force: true
  });
}

// =========================
// MAIN SCANNER
// =========================
export const scanRepoService = async repoUrl => {

  const { owner, repo } =
    extractRepoDetails(repoUrl);

  const repoRes = await axiosInstance.get(
    `${GITHUB_API}/repos/${owner}/${repo}`
  );

  const branch =
    repoRes.data.default_branch;

  const treeRes = await axiosInstance.get(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  const files = treeRes.data.tree;

  const totalFiles =
    files.filter(f => f.type === "blob").length;

  const useApi = totalFiles < 7;

  let findings = [];
  let scannedFiles = 0;

  // =========================
  // API MODE
  // =========================
  if (useApi) {

    console.log("⚡ Using API scanning");

    const validFiles =
      files.filter(shouldScan).slice(0, MAX_FILES);

    await Promise.all(
      validFiles.map(file =>
        limit(async () => {
          try {

            await new Promise(r =>
              setTimeout(r, 150)
            );

            const res =
              await axiosInstance.get(
                `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`
              );

            if (!res.data.content) return;

            const content = Buffer.from(
              res.data.content,
              "base64"
            ).toString("utf-8");

            const lines = content.split("\n");

            lines.forEach((line, index) => {

              // REGEX
              for (const sig of SIGNATURES) {
                const matches =
                  line.match(sig.regex);

                if (matches) {
                  findings.push({
                    repo: repoUrl,
                    secretType: sig.name,
                    file: file.path,
                    line: index + 1,
                    value: matches[0],
                    risk: sig.risk,
                    severity: sig.severity,
                    source: "api"
                  });
                }
              }

              // ENTROPY
              const entropyFindings =
                detectHighEntropySecrets(line);

              entropyFindings.forEach(ent => {
                findings.push({
                  repo: repoUrl,
                  file: file.path,
                  line: index + 1,
                  value: ent.value,
                  source: "entropy",
                  secretType: ent.type,
                  entropy: ent.entropy,
                  risk: ent.risk
                });
              });

            });

          } catch (err) {
            console.log(
              `❌ Error scanning ${file.path}`
            );
          }
        })
      )
    );

    scannedFiles = validFiles.length;

  } else {

    // =========================
    // CLONE MODE
    // =========================
    console.log("🐙 Using CLONE scanning");

    const repoPath =
      await cloneRepo(repoUrl);

    // FULL FILE SCAN
    const result =
      scanLocalFiles(repoPath, repoUrl);

    findings = result.findings;

    scannedFiles = result.scannedFiles;

    // =========================
    // LAST 5 COMMIT DIFFS
    // =========================
    const commitDiffs =
      await getCommitDiffs(
        repoPath,
        DIFF_DEPTH
      );

    for (const commitDiff of commitDiffs) {

      const diffFindings =
        scanDiff(
          commitDiff.diff,
          repoUrl,
          {
            from: commitDiff.from,
            to: commitDiff.to
          }
        );

      findings.push(...diffFindings);
    }

    deleteFolder(repoPath);
  }

  // =========================
  // DEDUPE
  // =========================
  const unique = new Set();

  findings = findings.filter(f => {
    const key =
      `${f.file}-${f.line}-${f.value}`;

    if (unique.has(key)) return false;

    unique.add(key);

    return true;
  });

  // =========================
  // AI SECURITY REVIEW
  // =========================
  const aiReview =
    await runGroqSecurityReview(findings);
    console.log(aiReview)

  // =========================
  // RETURN
  // =========================
  return {
    repo: `${owner}/${repo}`,
    findings,
    scannedFiles,
    mode: useApi ? "api" : "clone",
    totalFindings: findings.length,
    aiReview: aiReview.summary
  };
};