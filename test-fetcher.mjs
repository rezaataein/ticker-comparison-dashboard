/**
 * Integration check for the CORS proxy chain.
 * Run with: node test-fetcher.mjs
 * Needs network access. Not part of the shipped app.
 */
import fs from 'fs';
import vm from 'vm';

// `class X {}` is lexically scoped inside the script, so it never lands on the
// context object. Publish the three we need explicitly.
const src = fs.readFileSync('js/data-fetcher.js', 'utf8') +
    '\n;globalThis.DataFetcher = DataFetcher;' +
    '\n;globalThis.TickerNotFoundError = TickerNotFoundError;' +
    '\n;globalThis.DataServiceError = DataServiceError;';
// The browser supplies these globals; a bare vm context does not.
const ctx = {
    fetch, console, URL, URLSearchParams, TextDecoder,
    AbortController, setTimeout, clearTimeout
};
vm.createContext(ctx);
vm.runInContext(src, ctx);

const { DataFetcher, TickerNotFoundError, DataServiceError } = ctx;

const end = new Date();
const start = new Date(end.getTime() - 30 * 86400 * 1000);

let pass = 0, fail = 0;
const ok = (name, msg) => { console.log(`  PASS  ${name}${msg ? ' :: ' + msg : ''}`); pass++; };
const no = (name, msg) => { console.log(`  FAIL  ${name} :: ${msg}`); fail++; };

const timings = [];

async function expectData(name, ticker, wantCurrency) {
    const f = new DataFetcher();
    const t0 = Date.now();
    try {
        const d = await f.fetchTickerData(ticker, start, end, '1d');
        const ms = Date.now() - t0;
        timings.push(ms);
        const pts = d.close.filter(c => c !== null).length;
        if (pts === 0) return no(name, 'no non-null closes');
        if (wantCurrency && d.metadata.currency !== wantCurrency) {
            return no(name, `currency ${d.metadata.currency} != ${wantCurrency}`);
        }
        ok(name, `${d.metadata.symbol} ${d.metadata.currency} pts=${pts} ${ms} ms`);
    } catch (e) {
        no(name, `${e.name}: ${e.message.slice(0, 110)}`);
    }
}

async function expectParallelSpeed(name, tickers, budgetMs) {
    const f = new DataFetcher();
    const t0 = Date.now();
    const r = await f.fetchMultipleTickers(tickers, start, end, '1d');
    const ms = Date.now() - t0;
    if (r.successful.length !== tickers.length) {
        return no(name, `only ${r.successful.length}/${tickers.length} loaded in ${ms} ms`);
    }
    if (ms > budgetMs) return no(name, `${tickers.length} tickers took ${ms} ms, budget ${budgetMs} ms`);
    ok(name, `${tickers.length} tickers in ${ms} ms (budget ${budgetMs} ms)`);
}

async function expectNotFound(name, ticker) {
    const f = new DataFetcher();
    try {
        await f.fetchTickerData(ticker, start, end, '1d');
        no(name, 'expected TickerNotFoundError, got data');
    } catch (e) {
        if (e instanceof TickerNotFoundError) ok(name, `"${e.message}"`);
        else no(name, `expected TickerNotFoundError, got ${e.name}: ${e.message.slice(0, 90)}`);
    }
}

async function expectServiceError(name) {
    const f = new DataFetcher();
    // Every proxy points at a host that cannot resolve.
    f.corsProxies = [
        { name: 'dead1', url: () => 'https://nope.invalid/a', unwrap: null },
        { name: 'dead2', url: () => 'https://nope2.invalid/b', unwrap: null }
    ];
    try {
        await f.fetchTickerData('AAPL', start, end, '1d');
        no(name, 'expected DataServiceError, got data');
    } catch (e) {
        if (e instanceof DataServiceError) ok(name, `${e.attempts.length} attempts recorded`);
        else no(name, `expected DataServiceError, got ${e.name}`);
    }
}

async function expectFailoverWorks(name) {
    const f = new DataFetcher();
    // A dead proxy in front must not stop the good ones behind it.
    f.corsProxies = [
        { name: 'dead', url: () => 'https://nope.invalid/a', unwrap: null },
        ...f.corsProxies
    ];
    try {
        const d = await f.fetchTickerData('AAPL', start, end, '1d');
        ok(name, `recovered after dead proxy, pts=${d.close.filter(c => c !== null).length}`);
    } catch (e) {
        no(name, `${e.name}: ${e.message.slice(0, 110)}`);
    }
}

async function expectKinds(name) {
    const f = new DataFetcher();
    const r = await f.fetchMultipleTickers(['AAPL', 'NOTAREALTICKERXYZ'], start, end, '1d');
    const bad = r.failures.find(x => x.ticker === 'NOTAREALTICKERXYZ');
    if (!bad) return no(name, 'bad ticker did not fail');
    if (bad.kind !== 'not-found') return no(name, `kind=${bad.kind}, want not-found`);
    if (r.successful.length !== 1) return no(name, `successful=${r.successful.length}, want 1`);
    ok(name, `good ticker kept, bad ticker tagged kind=${bad.kind}`);
}

console.log('\n--- proxy chain integration ---');
await expectData('AAPL loads', 'AAPL', 'USD');
await expectData('TEC.TO keeps its dot suffix', 'TEC.TO', 'CAD');
await expectData('SHOP.TO loads in CAD', 'SHOP.TO', 'CAD');
await expectData('^GSPC index loads', '^GSPC', 'USD');
await expectData('BRK.B retries as BRK-B', 'BRK.B', 'USD');
await expectData('BRK-B loads directly', 'BRK-B', 'USD');
await expectNotFound('invalid symbol -> TickerNotFoundError', 'NOTAREALTICKERXYZ');
await expectServiceError('all proxies dead -> DataServiceError');
await expectFailoverWorks('dead first proxy -> fails over');
await expectKinds('failure kinds are tagged');
await expectParallelSpeed('4 tickers load well under budget', ['AAPL', 'MSFT', 'GOOG', 'TEC.TO'], 6000);

if (timings.length) {
    const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
    console.log(`\n  single-ticker latency: avg ${avg} ms, max ${Math.max(...timings)} ms`);
}
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
