// Offline preview only: fakes /api/* with sample data. Never included in the production build.
(() => {
  const now = () => Math.floor(Date.now() / 1000), T0 = now();
  const work = { 'Captain': 'Điều phối việc tuần', 'dr eggbot': 'Phân tích tỉ lệ nở trứng', 'Shopee Bot': 'Cập nhật giá flash sale', 'Tiktok MKT': 'Lên kịch bản video 11.11', 'AI Cinametic': 'Dựng clip ngọc trai', 'Kalodata Bot': 'Quét top sản phẩm', 'Soi Quảng Cáo FB': 'Theo dõi đối thủ', 'Pancake Bot': 'Trả lời inbox', 'GHTK-bot': 'Đối soát vận đơn', 'Website-PF': 'Tối ưu trang chủ' };
  const bots = {}; for (const [k, v] of Object.entries(work)) bots[k] = { state: 'lam', task: v, updated: T0 };
  const events = Object.entries(work).slice(0, 6).map(([bot, task], i) => ({ bot, state: 'lam', task, t: T0 - i * 420 }));
  const tasks = [{ to: 'Captain', task: 'Tổng hợp báo cáo doanh thu tháng 10', status: 'doing', ts: T0 - 3600 }, { to: 'Shopee Bot', task: 'Chuẩn bị voucher 11.11', status: 'done', ts: T0 - 86400 }];
  const blockers = [{ id: 'b1', bot: 'Tiktok Shop Bot', title: 'Cần duyệt mẫu quảng cáo mới', why: 'Chờ bệ hạ chọn 1 trong 3 mẫu', action: 'Xem và chọn mẫu', since: T0 - 2 * 86400 }, { id: 'b2', bot: 'Kiot Viet-bot', title: 'Token KiotViet hết hạn', why: 'Không đồng bộ được tồn kho', action: 'Cấp lại quyền truy cập', since: T0 - 5 * 3600 }];
  const J = o => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
  const real = window.fetch.bind(window);
  window.fetch = async (u, o = {}) => {
    const p = new URL(u, location.href).pathname;
    if (p.endsWith('/api/status')) return J({ now: now(), idle_minutes: 20, bots, events });
    if (p.endsWith('/api/tasks')) return J({ tasks });
    if (p.endsWith('/api/blockers')) return J({ blockers });
    if (p.endsWith('/api/task')) { const b = JSON.parse(o.body); const t = { ...b, status: 'pending', ts: now() }; tasks.unshift(t); return J({ task: t }); }
    if (p.endsWith('/api/blocker/resolve')) { const { id } = JSON.parse(o.body); const i = blockers.findIndex(b => b.id === id); if (i >= 0) blockers.splice(i, 1); return J({ ok: true }); }
    return real(u, o);
  };
})();
