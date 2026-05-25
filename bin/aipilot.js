#!/usr/bin/env node

/**
 * AIPILOT: Persistent Failure Memory for AI Coding
 * 
 * A passive local CLI sidecar tool that captures agent compilation/test failures,
 * records successful git resolutions, and prints non-authoritative recovery hints.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

// Resolve the local database directory and database path
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'global-ai-brain');
const DB_PATH = path.join(CONFIG_DIR, 'local_brain.db');

// Ensure database handles are loaded gracefully
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.error('❌ Error: the "sqlite3" dependency is missing. Please run "npm install sqlite3" in the workspace root.');
  process.exit(1);
}

// Help Menu
function printHelp() {
  console.log(`
AIPILOT: Persistent Failure Memory for AI Coding (V9 CLI Sidecar)

Usage:
  aipilot init                Initialize the local SQLite database & environment
  aipilot run -- [command]     Run terminal commands/agent tasks under failure observation
  aipilot recall "[query]"     Search past failures and recovery hints
  aipilot show [run_id]        Display raw traceback and git success diff of a specific run

Options:
  --help, -h                  Show this help screen
  --bypass                    Bypass filtering and run command cleanly
`);
}

// Main CLI Entry Router
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'init':
      await handleInit();
      break;
    case 'run':
      await handleRun(args.slice(1));
      break;
    case 'recall':
      await handleRecall(args[1]);
      break;
    case 'show':
      await handleShow(args[1]);
      break;
    default:
      console.error(`❌ Unknown command: "${command}"`);
      printHelp();
      process.exit(1);
  }
}

// Initialize SQLite database connection
function getDbConnection() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  return new sqlite3.Database(DB_PATH);
}

// Promisified SQLite wrappers
const dbRun = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// Command: aipilot init
async function handleInit() {
  console.log('⚡ Initializing AIPILOT Local Failure Memory Database...');
  const db = getDbConnection();

  try {
    db.serialize(async () => {
      // Enable high-performance Write-Ahead Logging (WAL) mode
      db.run('PRAGMA journal_mode=WAL;');

      // Create failure_runs table
      db.run(`
        CREATE TABLE IF NOT EXISTS failure_runs (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          branch TEXT NOT NULL,
          command TEXT NOT NULL,
          outcome TEXT NOT NULL,
          exit_code INTEGER DEFAULT 0,
          error_signature TEXT,
          error_text TEXT
        )
      `);

      // Create recovery_mappings table
      db.run(`
        CREATE TABLE IF NOT EXISTS recovery_mappings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          file_path TEXT NOT NULL,
          diff_summary TEXT,
          diff_patch TEXT,
          FOREIGN KEY(run_id) REFERENCES failure_runs(id) ON DELETE CASCADE
        )
      `);

      // Create compound index for error trace lookups
      db.run('CREATE INDEX IF NOT EXISTS idx_failure_signature ON failure_runs (error_signature, outcome);');

      console.log(`✔ AIPILOT initialized successfully!`);
      console.log(`✔ Memory Ledger stored at: ${DB_PATH}`);
      db.close();
    });
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Helper to normalize stack traces and tracebacks into a stable error signature
function getErrorSignature(stderrText) {
  if (!stderrText) return 'unknown_error';
  
  const lines = stderrText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Capture trace lines containing prominent error keywords
  const errorLines = lines.filter(line => 
    line.includes('Error') || 
    line.includes('failed') || 
    line.includes('exception') || 
    line.includes('Cannot find') ||
    line.includes('TypeScript') ||
    line.match(/^[a-zA-Z]+Error:/)
  ).slice(0, 2);
  
  const baseText = errorLines.length > 0 ? errorLines.join(' ') : lines.slice(0, 2).join(' ');
  
  // Normalize directories, numbers, variable strings, and quotes
  let normalized = baseText
    .replace(/\/Users\/[^\/]+\/[^\/]+/g, '[USER_DIR]') // Strip local user paths
    .replace(/:[0-9]+(:[0-9]+)?/g, '') // Strip file line numbers
    .replace(/line [0-9]+/g, 'line [LN]') // Strip "line X"
    .replace(/0x[0-9a-fA-F]+/g, '[ADDR]') // Strip hexadecimal addresses
    .replace(/'[^']+'/g, '[STRING]') // Strip single quote literals
    .replace(/"[^"]+"/g, '[STRING]') // Strip double quote literals
    .trim();
    
  return normalized || 'unknown_error';
}

// Command: aipilot run -- [command]
async function handleRun(runArgs) {
  // Check if we have the double dash "--" divider
  let commandToRunArgs = runArgs;
  if (runArgs[0] === '--') {
    commandToRunArgs = runArgs.slice(1);
  }

  if (commandToRunArgs.length === 0) {
    console.error('❌ Error: Please specify a command to observe. Example: aipilot run -- npm test');
    process.exit(1);
  }

  const rawCommandLine = commandToRunArgs.join(' ');

  // Direct bypass check
  if (process.argv.includes('--bypass') || process.env.AIPILOT_BYPASS === 'true') {
    const child = spawn(commandToRunArgs[0], commandToRunArgs.slice(1), { stdio: 'inherit', shell: true });
    child.on('exit', (code) => process.exit(code));
    return;
  }

  // Ensure DB initialized silently if missing
  if (!fs.existsSync(DB_PATH)) {
    await handleInit();
  }

  const db = getDbConnection();

  // Retrieve active git branch
  let branch = 'main';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    // Graceful fallback if git is missing or uninitialized
  }

  console.log(`⚡ AIPILOT: Observing failure-cycles on branch '${branch}'...`);

  // Spawn observed process
  const child = spawn(commandToRunArgs[0], commandToRunArgs.slice(1), { shell: true });

  let stderrBuffer = '';
  let stdoutBuffer = '';

  // Pipe streams interactively while buffering outputs in parallel (low overhead)
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    stdoutBuffer += data.toString();
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    stderrBuffer += data.toString();
  });

  // Pipe parent stdin straight to observed process for terminal compatibility
  process.stdin.pipe(child.stdin);

  child.on('exit', async (code) => {
    if (code > 0) {
      // ❌ TASK FAILS: Process crash or compile error detected
      const errSignature = getErrorSignature(stderrBuffer);
      const timestamp = Math.floor(Date.now() / 1000);

      // Generate a unique sequential run ID
      let runId = 'run-1';
      try {
        const countRow = await dbGet(db, 'SELECT COUNT(*) as cnt FROM failure_runs');
        runId = `run-${(countRow ? countRow.cnt : 0) + 1}`;
      } catch (e) {}

      // Insert failure run logs in SQLite
      try {
        await dbRun(db, `
          INSERT INTO failure_runs (id, timestamp, branch, command, outcome, exit_code, error_signature, error_text)
          VALUES (?, ?, ?, ?, 'failed', ?, ?, ?)
        `, [runId, timestamp, branch, rawCommandLine, code, errSignature, stderrBuffer]);

        // Search for previous successful recoveries matching the normalized error signature
        const matchedFix = await dbGet(db, `
          SELECT r.id, m.run_id, m.file_path, m.diff_summary 
          FROM failure_runs r
          JOIN recovery_mappings m ON r.id = m.run_id
          WHERE r.error_signature = ? AND r.outcome = 'success'
          ORDER BY r.timestamp DESC LIMIT 1
        `, [errSignature]);

        if (matchedFix) {
          // Output beautiful, non-authoritative recovery guidance to stderr
          process.stderr.write(`\n`);
          process.stderr.write(`┌── AIPILOT: PERSISTENT FAILURE MEMORY ────────────────────────────────┐\n`);
          process.stderr.write(`│ ⚠ Similar failure was resolved in a previous run: ${matchedFix.run_id}          │\n`);
          process.stderr.write(`│                                                                      │\n`);
          process.stderr.write(`│ Previous successful recovery:                                        │\n`);
          process.stderr.write(`│ • Modified file: ${matchedFix.file_path.padEnd(52)}│\n`);
          process.stderr.write(`│ • Summary: ${matchedFix.diff_summary.padEnd(58)}│\n`);
          process.stderr.write(`│                                                                      │\n`);
          process.stderr.write(`│ Note: This is speculative historical guidance.                       │\n`);
          process.stderr.write(`└── [Run 'aipilot show ${matchedFix.run_id}' to compare full success patch] ───────┘\n`);
          process.stderr.write(`\n`);
        }
      } catch (err) {
        console.error('⚠️ Warning: Failed to write to replay log database:', err.message);
      }
    } else {
      // ✔ TASK SUCCESS: Command finished cleanly
      try {
        // Look for the last failure run on this branch in the past 2 hours
        const twoHoursAgo = Math.floor(Date.now() / 1000) - (2 * 3600);
        const lastFailedRun = await dbGet(db, `
          SELECT id, error_signature FROM failure_runs 
          WHERE branch = ? AND outcome = 'failed' AND timestamp > ?
          ORDER BY timestamp DESC LIMIT 1
        `, [branch, twoHoursAgo]);

        if (lastFailedRun) {
          // Calculate the git diff changes
          let modifiedFiles = [];
          let diffPatch = '';
          try {
            modifiedFiles = execSync('git diff --name-only HEAD~1', { stdio: ['ignore', 'pipe', 'ignore'] })
              .toString().trim().split('\n').filter(f => f.length > 0);
            diffPatch = execSync('git diff HEAD~1', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
          } catch (gitErr) {
            // Rollback fallback to current unstaged diff if not committed yet
            try {
              modifiedFiles = execSync('git diff --name-only', { stdio: ['ignore', 'pipe', 'ignore'] })
                .toString().trim().split('\n').filter(f => f.length > 0);
              diffPatch = execSync('git diff', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
            } catch (e) {}
          }

          if (modifiedFiles.length > 0) {
            const timestamp = Math.floor(Date.now() / 1000);
            const runId = `success-${lastFailedRun.id}`;
            const summaryText = `Resolved compilation error in ${modifiedFiles[0]}`;

            // Save the successful resolution
            await dbRun(db, `
              INSERT INTO failure_runs (id, timestamp, branch, command, outcome, exit_code, error_signature, error_text)
              VALUES (?, ?, ?, ?, 'success', 0, ?, '')
            `, [runId, timestamp, branch, rawCommandLine, lastFailedRun.error_signature]);

            // Save recovery mapping links
            for (const file of modifiedFiles) {
              await dbRun(db, `
                INSERT INTO recovery_mappings (run_id, file_path, diff_summary, diff_patch)
                VALUES (?, ?, ?, ?)
              `, [runId, file, summaryText, diffPatch]);
            }

            console.log(`\n✔ AIPILOT: Successfully resolved previous ${lastFailedRun.id} failure on branch '${branch}'!`);
            console.log(`✔ Recovery fix mapped for future debugging guidance.`);
          }
        }
      } catch (err) {
        // Silent fail to preserve invisible sidecar profile
      }
    }

    db.close();
    process.exit(code);
  });
}

// Command: aipilot recall "[query]"
async function handleRecall(query) {
  if (!query) {
    console.error('❌ Error: Please specify a search query. Example: aipilot recall "TS2307"');
    process.exit(1);
  }

  const db = getDbConnection();
  console.log(`🔎 Searching Failure Memory for: "${query}"...\n`);

  try {
    const rows = await dbAll(db, `
      SELECT r.id, r.timestamp, r.branch, r.command, r.error_signature, m.file_path, m.diff_summary
      FROM failure_runs r
      LEFT JOIN recovery_mappings m ON r.id = m.run_id
      WHERE r.error_text LIKE ? OR r.error_signature LIKE ? OR r.command LIKE ?
      ORDER BY r.timestamp DESC
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    if (rows.length === 0) {
      console.log('No matching failure memories found.');
    } else {
      console.log(`Found ${rows.length} matches:\n`);
      rows.forEach(row => {
        const dateString = new Date(row.timestamp * 1000).toLocaleString();
        console.log(`[${row.id}] - ${dateString} on branch '${row.branch}'`);
        console.log(`  Command: ${row.command}`);
        console.log(`  Signature: ${row.error_signature}`);
        if (row.file_path) {
          console.log(`  🟢 Recovery fix: ${row.file_path} (${row.diff_summary})`);
        } else {
          console.log(`  🔴 Unresolved Failure`);
        }
        console.log('-'.repeat(60));
      });
    }
  } catch (err) {
    console.error('❌ Search failed:', err.message);
  }

  db.close();
}

// Command: aipilot show [run_id]
async function handleShow(runId) {
  if (!runId) {
    console.error('❌ Error: Please specify a run ID. Example: aipilot show run-1');
    process.exit(1);
  }

  const db = getDbConnection();
  try {
    const run = await dbGet(db, 'SELECT * FROM failure_runs WHERE id = ?', [runId]);
    if (!run) {
      console.error(`❌ Error: Run "${runId}" not found in database.`);
      db.close();
      process.exit(1);
    }

    const dateString = new Date(run.timestamp * 1000).toLocaleString();
    console.log('='.repeat(70));
    console.log(`AIPILOT EVENT: ${runId.toUpperCase()} (${run.outcome.toUpperCase()})`);
    console.log(`Timestamp: ${dateString}`);
    console.log(`Branch:    ${run.branch}`);
    console.log(`Command:   ${run.command}`);
    console.log('='.repeat(70));

    if (run.outcome === 'failed') {
      console.log('\nCaptured Error Traceback:\n');
      console.log(run.error_text);
    }

    const fixes = await dbAll(db, 'SELECT * FROM recovery_mappings WHERE run_id = ?', [runId]);
    if (fixes.length > 0) {
      console.log('\n🟢 RESOLUTION FIX PATHS:');
      fixes.forEach(fix => {
        console.log(`\nModified File: ${fix.file_path}`);
        console.log(`Summary:       ${fix.diff_summary}`);
        if (fix.diff_patch) {
          console.log('\nUnified Diff Patch:\n');
          console.log(fix.diff_patch);
        }
      });
    } else {
      // If it's a failure run, check if there is an associated success run linked to it
      const successLink = await dbGet(db, `
        SELECT run_id, file_path, diff_summary, diff_patch 
        FROM recovery_mappings 
        WHERE run_id = ?
      `, [`success-${runId}`]);

      if (successLink) {
        console.log('\n🟢 LINKED RESOLUTION FIX PATHS (Resolved subsequently):');
        console.log(`Modified File: ${successLink.file_path}`);
        console.log(`Summary:       ${successLink.diff_summary}`);
        if (successLink.diff_patch) {
          console.log('\nUnified Diff Patch:\n');
          console.log(successLink.diff_patch);
        }
      } else if (run.outcome === 'failed') {
        console.log('\n🔴 This failure remains unresolved.');
      }
    }
    console.log('='.repeat(70));

  } catch (err) {
    console.error('❌ Failed to fetch run logs:', err.message);
  }

  db.close();
}

main().catch(err => {
  console.error('❌ Critical runtime crash:', err.message);
  process.exit(1);
});
