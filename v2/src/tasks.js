// "Giao việc" panel: assign tasks to Captain / bots via POST /api/task
const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = ts => new Date(ts * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Saigon', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false });
const ST = { pending: ['Đã gửi', 'p', 'chưa cấu hình webhook'], sent: ['Đã gửi', 's'], failed: ['Gửi lỗi', 'f'], doing: ['Đang làm', 'd'], done: ['Xong', 'x'] };
let names = [], timer = null, getNames = () => [];
function fillNames() {
  const n = ['Captain', ...getNames().filter(n => n !== 'Captain')];
  if (n.join() === names.join()) return; names = n;
  $('#tk-to').innerHTML = names.map(n => `<option>${esc(n)}</option>`).join('');
}
export function initTasks(get) {
  getNames = get; fillNames();
  $('#btn-task').onclick = () => openTask();
  $('#tk-x').onclick = closeTask;
  $('#tk-form').onsubmit = send;
  $('#btn-blk').onclick = () => { openTask(); setTimeout(() => { const t = $('#task'); t.scrollTop = $('#blk-h').offsetTop - 8; }, 400); };
  $('#blk-list').addEventListener('click', resolve);
  loadBlk(); setInterval(loadBlk, 60000);
  $('#tk-text').addEventListener('input', () => $('#tk-n').textContent = $('#tk-text').value.length + '/1000');
}
export function openTask(to = 'Captain', ctx = '') {
  fillNames();
  $('#tk-to').value = names.includes(to) ? to : 'Captain';
  $('#tk-ctx').textContent = ctx; $('#tk-msg').textContent = '';
  $('#task').style.display = 'block'; setTimeout(() => $('#tk-text').focus(), 50);
  load(); loadBlk(); clearInterval(timer); timer = setInterval(() => { load(); loadBlk(); }, 15000);
}
function closeTask() { $('#task').style.display = 'none'; clearInterval(timer); }
async function load() {
  try {
    const r = await fetch('/api/tasks?_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw 0; render((await r.json()).tasks || []);
  } catch { $('#tk-list').innerHTML = '<li class="e">Không tải được danh sách</li>'; }
}
function render(l) {
  $('#tk-list').innerHTML = l.length ? l.slice(0, 20).map(t => { const s = ST[t.status] || ST.sent;
    return `<li><span class="st ${s[1]}" title="${esc(s[2] || t.status)}">${s[0]}</span><b>${esc(t.to)}</b><em>${hm(t.ts)}</em><div>${esc(t.task)}</div></li>`; }).join('') : '<li class="e">Chưa có việc nào</li>';
}
async function send(e) {
  e.preventDefault();
  const to = $('#tk-to').value, task = $('#tk-text').value.trim(), m = $('#tk-msg'), b = $('#tk-send');
  if (!task) { m.textContent = 'Nhập nội dung công việc'; return; }
  b.disabled = true; m.textContent = 'Đang gửi…';
  try {
    const r = await fetch('/api/task', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, task }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || r.status);
    $('#tk-text').value = ''; $('#tk-n').textContent = '0/1000';
    m.textContent = d.task.status === 'failed' ? '⚠ Đã lưu nhưng gửi webhook lỗi' : d.task.status === 'pending' ? '✓ Đã lưu (webhook chưa cấu hình)' : '✓ Đã gửi cho ' + to;
    load();
  } catch (err) { m.textContent = '✗ Lỗi: ' + err.message; } finally { b.disabled = false; }
}
const ago = ts => { const d = Math.floor((Date.now() / 1000 - ts) / 86400); return d >= 1 ? d + ' ngày' : Math.max(1, Math.floor((Date.now() / 1000 - ts) / 3600)) + ' giờ'; };
const day = ts => new Date(ts * 1000).toLocaleDateString('vi-VN', { timeZone: 'Asia/Saigon', day: '2-digit', month: '2-digit' });
async function loadBlk() {
  try {
    const r = await fetch('/api/blockers?_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw 0; renderBlk((await r.json()).blockers || []);
  } catch { $('#blk-n').textContent = '?'; $('#blk-list').innerHTML = '<li class="e">Không tải được danh sách</li>'; }
}
function renderBlk(l) {
  const n = $('#blk-n'); n.textContent = l.length; n.className = l.length ? 'on' : '';
  $('#blk-list').innerHTML = l.length ? l.map(b => `<li><em title="${day(b.since)}">từ ${day(b.since)} · ${ago(b.since)}</em><b>${esc(b.bot)}</b>
<div class="t">${esc(b.title)}</div>${b.why ? `<div><span class="k">Lý do:</span> ${esc(b.why)}</div>` : ''}${b.action ? `<div class="a">👉 ${esc(b.action)}</div>` : ''}
<button data-id="${esc(b.id)}">✓ Đã xử lý</button></li>`).join('') : '<li class="e">Không có việc kẹt 🎉</li>';
}
async function resolve(e) {
  const btn = e.target.closest('button[data-id]'); if (!btn) return;
  btn.disabled = true; btn.textContent = 'Đang lưu…';
  try {
    const r = await fetch('/api/blocker/resolve', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn.dataset.id }) });
    if (!r.ok) throw 0; loadBlk();
  } catch { btn.disabled = false; btn.textContent = '✗ Lỗi, thử lại'; }
}
