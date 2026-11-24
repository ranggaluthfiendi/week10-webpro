const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require('@playwright/test');
const base = 'http://127.0.0.1:3101';
const results = [];
const ownedIds = new Set();
let server, browser;
async function start() {
  server = spawn(process.execPath, ['dist/main.js'], { env: { ...process.env, PORT: '3101' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 15000);
    server.stdout.on('data', data => { if (data.toString().includes('Aplikasi mahasiswa:')) { clearTimeout(timer); resolve(); } });
    server.stderr.on('data', data => process.stderr.write(data));
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Server exited: ' + code)); });
  });
}
async function stop() {
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
}
async function request(method, path, body, expected) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  results.push({ method, path, status: response.status, body: data });
  assert.equal(response.status, expected, method + ' ' + path);
  return data;
}
(async () => {
  fs.mkdirSync('docs/screenshots', { recursive: true });
  await start();
  const nim = 'TEST-' + Date.now();
  const student = await request('POST', '/students', { nim, nama: 'Dina Putri (Data Uji)', jurusan: 'Informatika' }, 201);
  ownedIds.add(student.id);
  assert.equal(student.nim, nim);
  assert.ok((await request('GET', '/students', undefined, 200)).some(row => row.id === student.id));
  assert.equal((await request('GET', '/students/' + student.id, undefined, 200)).nama, student.nama);
  assert.equal((await request('PATCH', '/students/' + student.id, { nama: 'Dina Putri Diperbarui' }, 200)).nama, 'Dina Putri Diperbarui');
  const filtered = await request('GET', '/students?jurusan=informatika', undefined, 200);
  assert.ok(filtered.some(row => row.id === student.id));
  assert.ok(filtered.every(row => row.jurusan.toLowerCase() === 'informatika'));
  assert.ok((await request('GET', '/students/count', undefined, 200)).total >= 1);
  await request('POST', '/students', { nim, nama: 'Duplikat', jurusan: 'Informatika' }, 409);
  await request('POST', '/students', { nim: 123, nama: '', jurusan: 'Informatika', asing: 'ditolak' }, 400);
  await request('PATCH', '/students/' + student.id, { nama: null }, 400);
  await request('GET', '/students/bukan-angka', undefined, 400);
  await stop();
  await start();
  assert.equal((await request('GET', '/students/' + student.id, undefined, 200)).nama, 'Dina Putri Diperbarui');
  results.push({ check: 'Data tetap ada setelah proses server dihentikan dan dijalankan kembali', status: 'PASS' });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(base);
  await page.getByText('Dina Putri Diperbarui', { exact: true }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/01-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screenshots/02-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('#nim').fill(nim + '-UI');
  await page.locator('#nama').fill('Budi Santoso (Uji Browser)');
  await page.locator('#jurusan').fill('Sistem Informasi');
  const created = page.waitForResponse(r => r.url() === base + '/students' && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  const uiResponse = await created;
  assert.equal(uiResponse.status(), 201);
  const uiStudent = await uiResponse.json();
  ownedIds.add(uiStudent.id);
  let row = page.locator('tr').filter({ hasText: nim + '-UI' });
  await row.getByRole('button', { name: 'Ubah', exact: true }).click();
  await page.locator('#nama').fill('Budi Santoso Diperbarui');
  const updated = page.waitForResponse(r => r.url() === base + '/students/' + uiStudent.id && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  assert.equal((await updated).status(), 200);
  await page.getByText('Budi Santoso Diperbarui', { exact: true }).waitFor();
  await page.locator('#filter').fill('Sistem Informasi');
  await page.getByRole('button', { name: 'Terapkan' }).click();
  await page.getByText('(1 ditampilkan', { exact: false }).waitFor();
  row = page.locator('tr').filter({ hasText: nim + '-UI' });
  page.once('dialog', dialog => dialog.accept());
  const deleted = page.waitForResponse(r => r.url() === base + '/students/' + uiStudent.id && r.request().method() === 'DELETE');
  await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  assert.equal((await deleted).status(), 200);
  ownedIds.delete(uiStudent.id);
  await page.getByText('Mahasiswa berhasil dihapus.', { exact: true }).waitFor();
  results.push({ check: 'Browser: tambah, ubah, filter, hapus dan mobile tanpa overflow', status: 'PASS' });
  await request('DELETE', '/students/' + student.id, undefined, 200);
  ownedIds.delete(student.id);
  await request('GET', '/students/' + student.id, undefined, 404);
  await request('PATCH', '/students/' + student.id, { nama: 'Tidak ada' }, 404);
  await request('DELETE', '/students/' + student.id, undefined, 404);
  const evidence = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const escape = value => JSON.stringify(value, null, 2).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  await evidence.setContent('<html lang="id"><meta charset="utf-8"><title>Hasil Uji API</title><style>body{font:16px system-ui;background:#f3f6fb;color:#192c46;padding:30px}article{background:white;border:1px solid #ccd7e5;border-radius:8px;padding:18px;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:18px}</style><h1>Hasil pengujian API mahasiswa</h1><p>Respons aktual otomatis • ' + new Date().toISOString() + '</p>' + results.map(result => '<article><h2>' + (result.check || result.method + ' ' + result.path) + ' — ' + result.status + '</h2><pre>' + escape(result.body ?? 'PASS') + '</pre></article>').join('') + '</html>');
  await evidence.screenshot({ path: 'docs/screenshots/03-hasil-uji-api.png', fullPage: true });
  fs.writeFileSync('docs/test-results.json', JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2));
  console.log('PASS: CRUD, filter/count, validasi, duplikat, 404, persistensi restart, dan CRUD browser.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const id of ownedIds) {
    try { await fetch(base + '/students/' + id, { method: 'DELETE' }); } catch {}
  }
  if (browser) await browser.close();
  await stop();
});
