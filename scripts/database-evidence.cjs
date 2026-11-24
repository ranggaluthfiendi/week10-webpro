require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('@playwright/test');
(async () => {
  const prisma = new PrismaClient();
  let browser;
  try {
    const cli = (args) => execFileSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { encoding: 'utf8' });
    const status = cli(['migrate', 'status']);
    const validation = cli(['validate']);
    const columns = await prisma.$queryRaw`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' ORDER BY ordinal_position`;
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at`;
    const data = { checkedAt: new Date().toISOString(), validation, status, columns, migrations };
    fs.writeFileSync('docs/database-check.json', JSON.stringify(data, null, 2));
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    const sections = { 'Schema Prisma': fs.readFileSync('prisma/schema.prisma', 'utf8'), 'Validasi schema': validation, 'Status migrasi aktual': status, 'Kolom tabel dari PostgreSQL': JSON.stringify(columns, null, 2), 'Riwayat migrasi dari PostgreSQL': JSON.stringify(migrations, null, 2) };
    await page.setContent('<html lang="id"><meta charset="utf-8"><style>body{font:16px system-ui;background:#f3f6fb;color:#192c46;padding:30px}section{background:white;padding:20px;border:1px solid #d4dfed;border-radius:8px;margin:20px 0}pre{white-space:pre-wrap}</style><h1>Bukti database dan Prisma</h1><p>Hasil pemeriksaan langsung • ' + esc(data.checkedAt) + '</p>' + Object.entries(sections).map(([title, body]) => '<section><h2>' + esc(title) + '</h2><pre>' + esc(body) + '</pre></section>').join('') + '</html>');
    await page.screenshot({ path: 'docs/screenshots/04-database-prisma.png', fullPage: true });
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
