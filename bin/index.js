#!/usr/bin/env node
/**
 * Context Optimization System - global-token-saver CLI Binary
 * Location: /Users/tuoaoa/.ai_global/global-token-saver/bin/index.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI Escape Codes for stunning premium styling
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

const BANNER = `
${BOLD}${CYAN}======================================================================${RESET}
${BOLD}${GREEN}🚀 WELCOME TO THE AI PILOT CONTEXT PRUNING SYSTEM (AIPILOT.VN) 🚀${RESET}
${BOLD}${CYAN}======================================================================${RESET}
${BOLD}${YELLOW}💡 Save up to 97% of input tokens on Claude 3.5 Sonnet & GPT-4o!${RESET}
${BOLD}${BLUE}👉 Go to https://aipilot.vn to register and fetch your free API Key.${RESET}
${BOLD}${GREEN}👉 Join our GLOBAL POOL mode to leverage pre-cached open-source
   architecture metadata shared by 10,000+ developers!${RESET}
${BOLD}${CYAN}======================================================================${RESET}
`;

function showBanner() {
    console.log(BANNER);
}

const configDir = path.join(process.env.HOME, '.config', 'global-ai-brain');
const configFile = path.join(configDir, 'config.json');

function initConfig() {
    showBanner();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(`${BOLD}${YELLOW}Enter your AIPILOT.VN API Key: ${RESET}`, (apiKey) => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            console.error(`${BOLD}\x1b[31m❌ Error: API Key cannot be empty.${RESET}`);
            rl.close();
            process.exit(1);
        }

        try {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            const configData = {
                api_key: trimmedKey,
                created_at: new Date().toISOString(),
                server_url: "http://180.93.144.63:4005"
            };

            fs.writeFileSync(configFile, JSON.stringify(configData, null, 2), 'utf8');
            console.log(`\n${BOLD}${GREEN}✓ Configuration saved successfully!${RESET}`);
            console.log(`Config path: ${configFile}`);
            console.log(`Token active: ${trimmedKey.substring(0, 12)}...`);
            console.log(`\n${BOLD}${CYAN}Global AI Brain context pruning is now active globally.${RESET}`);
        } catch (err) {
            console.error(`${BOLD}\x1b[31m❌ Error saving configuration: ${err.message}${RESET}`);
        }

        rl.close();
    });
}

// Command dispatcher
const args = process.argv.slice(2);
const command = args[0];

if (command === 'init') {
    initConfig();
} else {
    showBanner();
    console.log(`${BOLD}Usage:${RESET}`);
    console.log(`  npx global-token-saver init    Initialize developer credentials`);
    console.log(`  npx global-token-saver --help  Display this help panel`);
    process.exit(0);
}
