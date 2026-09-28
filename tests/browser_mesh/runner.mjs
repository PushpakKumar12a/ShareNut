import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const tempDirectory = path.join(scriptDirectory, "temp");

async function promptTestConfiguration() {
  const rl = readline.createInterface({ input, output });

  console.log("======================================================================");
  console.log("          ShareNut Real Chrome Full-Mesh Test Configuration           ");
  console.log("======================================================================\n");

  let payloadSizeMb = 10;
  let totalPeers = 6;

  try {
    const payloadInput = await rl.question("► Enter payload size in MB [default: 10]: ");
    const parsedPayload = parseInt(payloadInput.trim(), 10);
    if (!isNaN(parsedPayload) && parsedPayload > 0) {
      payloadSizeMb = parsedPayload;
    }

    const peersInput = await rl.question("► Enter number of peers (min 2) [default: 6]: ");
    const parsedPeers = parseInt(peersInput.trim(), 10);
    if (!isNaN(parsedPeers) && parsedPeers >= 2) {
      totalPeers = parsedPeers;
    }
  } finally {
    rl.close();
  }

  console.log(`\n✓ Configured test: ${payloadSizeMb} MB payload across ${totalPeers} Chrome peers.`);
  console.log(`✓ Artifacts directory: ${tempDirectory}\n`);

  return { payloadSizeMb, totalPeers };
}

function ensureTempDirectory() {
  if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, { recursive: true });
  }
}

function compileTypeScriptTest() {
  console.log("[STEP 0] Compiling run_mesh_browser_test.ts into temp folder...");
  const compiledJsPath = path.join(tempDirectory, "run_mesh_browser_test.js");
  const sourceTsPath = path.join(scriptDirectory, "run_mesh_browser_test.ts");

  const buildResult = spawnSync(
    "bun",
    [
      "build",
      sourceTsPath,
      "--outfile",
      compiledJsPath,
      "--target",
      "node",
      "--external",
      "playwright",
    ],
    {
      stdio: "inherit",
      shell: true,
      cwd: scriptDirectory,
    }
  );

  if (buildResult.status !== 0) {
    throw new Error(`Build failed with exit status ${buildResult.status}`);
  }

  console.log("[STEP 0] Successfully built temporary test bundle.\n");
  return compiledJsPath;
}

function executeBrowserMeshTest(compiledJsPath, payloadSizeMb, totalPeers) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(
      process.execPath,
      [compiledJsPath],
      {
        stdio: "inherit",
        cwd: scriptDirectory,
        env: {
          ...process.env,
          PAYLOAD_MB: String(payloadSizeMb),
          PEERS: String(totalPeers),
          TEMP_DIR: tempDirectory,
          RUNNER_MANAGED: "true",
        },
      }
    );

    const handleTermination = () => {
      console.log("\n[INTERRUPT] Received termination signal. Stopping test process...");
      childProcess.kill("SIGINT");
    };

    process.on("SIGINT", handleTermination);
    process.on("SIGTERM", handleTermination);

    childProcess.on("error", (spawnError) => {
      process.off("SIGINT", handleTermination);
      process.off("SIGTERM", handleTermination);
      reject(spawnError);
    });

    childProcess.on("close", (exitCode) => {
      process.off("SIGINT", handleTermination);
      process.off("SIGTERM", handleTermination);
      resolve(exitCode ?? 0);
    });
  });
}

function cleanupTempArtifacts() {
  console.log("\n======================================================================");
  console.log("                        POST-TEST CLEANUP                             ");
  console.log("======================================================================");
  if (fs.existsSync(tempDirectory)) {
    try {
      const filesToRemove = fs.readdirSync(tempDirectory);
      console.log(`► Deleting ${filesToRemove.length} temporary file(s) in: ${tempDirectory}`);
      for (const item of filesToRemove) {
        console.log(`   • Removing: ${item}`);
      }
      fs.rmSync(tempDirectory, { recursive: true, force: true });
      console.log("► [CLEANUP] Deleted JS build and payload file(s) successfully.\n");
    } catch (cleanupError) {
      console.warn("⚠️ Warning during artifact cleanup:", cleanupError.message);
    }
  } else {
    console.log("► [CLEANUP] No temporary files found to delete.\n");
  }
}

async function main() {
  let exitCode = 0;
  try {
    const { payloadSizeMb, totalPeers } = await promptTestConfiguration();
    ensureTempDirectory();
    const compiledJsPath = compileTypeScriptTest();
    exitCode = await executeBrowserMeshTest(compiledJsPath, payloadSizeMb, totalPeers);
  } catch (error) {
    console.error("\n❌ Test runner error:", error.message || error);
    exitCode = 1;
  } finally {
    cleanupTempArtifacts();
  }

  process.exit(exitCode);
}

main();
