import { createServer } from "http";
import { spawn } from "child_process";
import { readFile, writeFile, unlink } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const ROOT_DIR = process.cwd();
const RHUBARB_DIR =
  process.env.RHUBARB_DIR ||
  path.resolve(ROOT_DIR, "Rhubarb-Lip-Sync-1.14.0-Windows");
const RHUBARB_PATH = process.env.RHUBARB_PATH || path.join(RHUBARB_DIR, "rhubarb.exe");
const PORT = process.env.PORT || 3001;

const loadEnvFile = () => {
  const envPath = path.resolve(ROOT_DIR, ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
};

const jsonResponse = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const collectRequestBody = async (req) => {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
};

const synthesizeAzureTTS = async ({ text, voice }) => {
  const region = process.env.AZURE_TTS_REGION;
  const key = process.env.AZURE_TTS_KEY;
  const outputFormat = "riff-16khz-16bit-mono-pcm";

  if (!region || !key) {
    throw new Error("Missing AZURE_TTS_REGION or AZURE_TTS_KEY");
  }

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const safeText = text.replace(/[<>]/g, "");
  const ssml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<speak version="1.0" xml:lang="en-US">',
    `<voice name="${voice}">${safeText}</voice>`,
    "</speak>",
  ].join("");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": outputFormat,
      "User-Agent": "rhubarb-lipsync-local",
    },
    body: ssml,
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`Azure TTS error: ${response.status} ${textBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const runRhubarb = async ({ wavPath, outputPath }) => {
  return new Promise((resolve, reject) => {
    const args = ["-f", "json", "-o", outputPath, wavPath];
    const rhubarb = spawn(RHUBARB_PATH, args, {
      stdio: ["ignore", "ignore", "pipe"],
      cwd: RHUBARB_DIR,
    });
    let stderr = "";
    rhubarb.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    rhubarb.on("error", reject);
    rhubarb.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`rhubarb.exe failed (${code}): ${stderr}`));
        return;
      }
      resolve();
    });
  });
};

const handler = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/rhubarb") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  try {
    const body = await collectRequestBody(req);
    const payload = JSON.parse(body || "{}");
    const text = String(payload.text || "").trim();
    const voice = payload.voice || process.env.AZURE_TTS_VOICE || "ja-JP-NaokiNeural";

    if (!text) {
      jsonResponse(res, 400, { error: "Text is required" });
      return;
    }
    if (!existsSync(RHUBARB_PATH)) {
      jsonResponse(res, 500, { error: "rhubarb.exe not found" });
      return;
    }

    const wavBuffer = await synthesizeAzureTTS({ text, voice });
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const wavPath = path.join(tmpdir(), `rhubarb-${stamp}.wav`);
    const outputPath = path.join(tmpdir(), `rhubarb-${stamp}.json`);

    await writeFile(wavPath, wavBuffer);
    await runRhubarb({ wavPath, outputPath });
    const rhubarbJson = await readFile(outputPath, "utf8");
    const rhubarbData = JSON.parse(rhubarbJson);

    jsonResponse(res, 200, {
      rhubarbData,
      audioBase64: wavBuffer.toString("base64"),
      audioMime: "audio/wav",
    });

    await unlink(wavPath);
    await unlink(outputPath);
  } catch (error) {
    jsonResponse(res, 500, { error: error.message || "Server error" });
  }
};

loadEnvFile();

createServer(handler).listen(PORT, () => {
  console.log(`Rhubarb server listening on http://localhost:${PORT}`);
});
