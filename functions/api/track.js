// Cloudflare Pages Function — POST /api/track
// 接收游戏事件（开局 / 结局 / JS 错误），写入 KV 计数。
// 在 Pages 项目 Settings → Functions → KV 绑定里，变量名填 STATS（绑到你手动建的 KV 命名空间）。
// 事件体：{ ev:'start'|'end'|'jserror', id, group, target, msg, t }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
}
function sanitize(s) {
  return String(s == null ? '' : s).replace(/[^一-龥A-Za-z0-9_-]/g, '').slice(0, 40);
}

export async function onRequestPost({ request, env }) {
  try {
    const kv = env.STATS;
    if (!kv) return json({ ok: false, error: 'KV binding STATS not configured' });

    const b = await request.json().catch(() => ({}));
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const inc = async (key) => {
      const cur = parseInt((await kv.get(key)) || '0', 10) || 0;
      await kv.put(key, String(cur + 1));
    };

    const ops = [];
    if (b.ev === 'start') {
      ops.push(inc('plays'), inc('plays:' + day));
    } else if (b.ev === 'end') {
      ops.push(inc('finishes'), inc('finishes:' + day));
      if (b.id) ops.push(inc('ending:' + sanitize(b.id)));
      if (b.group) ops.push(inc('group:' + sanitize(b.group)));
      if (b.target) ops.push(inc('target:' + sanitize(b.target)));
    } else if (b.ev === 'jserror') {
      ops.push(inc('jserror'));
    }
    await Promise.all(ops);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }); // 监控端点永不影响前端
  }
}

export async function onRequestGet() {
  return json({ ok: true, hint: 'POST game events here; aggregates at /api/stats?token=...' });
}
