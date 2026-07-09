// Cloudflare Pages Function — GET /api/stats?token=XXX
// 返回聚合监控数据（总开局/完成局、按结局/四档/大哥/按天）。
// 用 STATS_TOKEN（Pages 环境变量/密钥）保护；未设置则公开只读。

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (env.STATS_TOKEN && url.searchParams.get('token') !== env.STATS_TOKEN) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  const kv = env.STATS;
  if (!kv) return json({ ok: false, error: 'KV binding STATS not configured' });

  const raw = {};
  let cursor;
  do {
    const page = await kv.list({ cursor });
    for (const k of page.keys) raw[k.name] = parseInt((await kv.get(k.name)) || '0', 10);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const grouped = { plays: raw.plays || 0, finishes: raw.finishes || 0, jserror: raw.jserror || 0,
    endings: {}, groups: {}, targets: {}, daily: {} };
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('ending:')) grouped.endings[k.slice(7)] = v;
    else if (k.startsWith('group:')) grouped.groups[k.slice(6)] = v;
    else if (k.startsWith('target:')) grouped.targets[k.slice(7)] = v;
    else if (k.startsWith('plays:')) (grouped.daily[k.slice(6)] ||= {}).plays = v;
    else if (k.startsWith('finishes:')) (grouped.daily[k.slice(9)] ||= {}).finishes = v;
  }
  grouped.finishRate = grouped.plays ? +(grouped.finishes / grouped.plays).toFixed(3) : 0;
  return json({ ok: true, generatedAt: new Date().toISOString(), stats: grouped });
}
