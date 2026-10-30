import { writeFileSync } from 'node:fs';

const token = process.env.MIXPANEL_TOKEN?.trim();
if (token) {
  writeFileSync('public/analytics-config.mjs', `export const MIXPANEL_TOKEN = ${JSON.stringify(token)};\n`);
}
