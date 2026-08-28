/**
 * Latency benchmark for the CORS proxy chain.
 * Measures each proxy independently: time to usable JSON, plus failures.
 */
const now = Math.floor(Date.now() / 1000);
const p1 = now - 30 * 86400;
const yurl = t =>
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}` +
    `?period1=${p1}&period2=${now}&interval=1d`;

const PROXIES = [
    { name: 'allorigins-get', url: u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, unwrap: b => JSON.parse(b).contents },
    { name: 'allorigins-raw', url: u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, unwrap: null },
    { name: 'codetabs',       url: u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, unwrap: null },
    { name: 'jina',           url: u => `https://r.jina.ai/${u}`, headers: { 'x-respond-with': 'text' }, unwrap: null },
];

const TIMEOUT = 15000;

async function timeOne(proxy, ticker) {
    const t0 = Date.now();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    try {
        const r = await fetch(proxy.url(yurl(ticker)), { headers: proxy.headers || {}, signal: ac.signal });
        let body = await r.text();
        if (proxy.unwrap) body = proxy.unwrap(body);
        const d = JSON.parse(body);
        const okData = !!(d && d.chart && d.chart.result && d.chart.result.length);
        return { ms: Date.now() - t0, ok: okData, note: okData ? `${r.status}` : `${r.status} no-data` };
    } catch (e) {
        return { ms: Date.now() - t0, ok: false, note: e.name === 'AbortError' ? 'TIMEOUT' : e.message.slice(0, 30) };
    } finally {
        clearTimeout(timer);
    }
}

const TICKERS = ['AAPL', 'MSFT', 'TEC.TO', '^GSPC'];
const stats = {};

console.log(`\nPer-proxy latency, ${TICKERS.length} tickers each (timeout ${TIMEOUT} ms)\n`);
for (const proxy of PROXIES) {
    stats[proxy.name] = [];
    for (const t of TICKERS) {
        const r = await timeOne(proxy, t);
        stats[proxy.name].push(r);
        console.log(`  ${proxy.name.padEnd(16)} ${t.padEnd(8)} ${String(r.ms).padStart(6)} ms  ${r.ok ? 'OK ' : 'ERR'} ${r.note}`);
    }
}

console.log('\nSummary (successful calls only):');
for (const [name, rs] of Object.entries(stats)) {
    const good = rs.filter(r => r.ok).map(r => r.ms);
    const okCount = good.length;
    if (!okCount) { console.log(`  ${name.padEnd(16)} 0/${rs.length} ok`); continue; }
    const avg = Math.round(good.reduce((a, b) => a + b, 0) / okCount);
    const min = Math.min(...good), max = Math.max(...good);
    console.log(`  ${name.padEnd(16)} ${okCount}/${rs.length} ok   avg ${String(avg).padStart(6)} ms   min ${String(min).padStart(6)}   max ${String(max).padStart(6)}`);
}
console.log();
