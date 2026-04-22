#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const raw = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const clientId = env.DISCORD_CLIENT_ID;
if (!clientId) {
  console.error('Missing DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const permissions = '8'; // Administrator
const scopes = 'bot applications.commands';
const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${encodeURIComponent(scopes)}`;

console.log(url);
console.log('');
console.log('Checklist:');
console.log('- Bot role should have Administrator in the target server');
console.log('- Bot application must have Message Content Intent enabled in the Developer Portal');
console.log('- Re-invite the bot with the URL above after permission changes');
console.log('- Keep ALLOW_ALL_USERS=true only if you really want open in-guild access');
