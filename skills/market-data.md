---
name: market-data
description: Get real-time cryptocurrency prices, stock quotes, and forex rates using free APIs (no API keys needed).
---

# Market Data

Free APIs for financial data. No API keys required.

## When to use

Use this skill when the user asks about cryptocurrency prices, stock quotes, forex/exchange rates, market cap, trading volume, or financial trends.

## Cryptocurrency — CoinGecko API

Quick price check (supports multiple coins and currencies):

```bash
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
```

Multiple coins:

```bash
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,eur&include_24hr_change=true&include_market_cap=true"
```

Top coins by market cap:

```bash
curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1" | python3 -c "
import sys, json
coins = json.load(sys.stdin)
for c in coins:
    print(f\"{c['market_cap_rank']}. {c['name']} ({c['symbol'].upper()}): \${c['current_price']:,.2f}  24h: {c['price_change_percentage_24h']:+.1f}%  MCap: \${c['market_cap']/1e9:.1f}B\")
"
```

Coin details (description, links, stats):

```bash
curl -s "https://api.coingecko.com/api/v3/coins/bitcoin" | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d['market_data']
print(f\"{d['name']} ({d['symbol'].upper()})\")
print(f\"Price: \${p['current_price']['usd']:,.2f}\")
print(f\"24h Change: {p['price_change_percentage_24h']:+.1f}%\")
print(f\"7d Change: {p['price_change_percentage_7d']:+.1f}%\")
print(f\"Market Cap: \${p['market_cap']['usd']/1e9:.1f}B\")
print(f\"24h Volume: \${p['total_volume']['usd']/1e9:.1f}B\")
print(f\"ATH: \${p['ath']['usd']:,.2f}\")
"
```

Trending coins:

```bash
curl -s "https://api.coingecko.com/api/v3/search/trending" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for item in d.get('coins', [])[:10]:
    c = item['item']
    print(f\"{c['score']+1}. {c['name']} ({c['symbol']}) — rank #{c['market_cap_rank']}\")
"
```

Common coin IDs: `bitcoin`, `ethereum`, `solana`, `dogecoin`, `cardano`, `ripple`, `polkadot`, `avalanche-2`, `chainlink`, `litecoin`

## Stock Quotes — Yahoo Finance

Current stock price:

```bash
curl -s "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d['chart']['result'][0]
meta = r['meta']
print(f\"{meta['symbol']}: \${meta['regularMarketPrice']:.2f}\")
print(f\"Previous Close: \${meta['chartPreviousClose']:.2f}\")
change = meta['regularMarketPrice'] - meta['chartPreviousClose']
pct = change / meta['chartPreviousClose'] * 100
print(f\"Change: {change:+.2f} ({pct:+.1f}%)\")
"
```

Multiple stocks — check one at a time or use a loop:

```bash
for sym in AAPL GOOGL MSFT TSLA; do
  curl -s "https://query1.finance.yahoo.com/v8/finance/chart/$sym?range=1d&interval=1d" | python3 -c "
import sys, json
d = json.load(sys.stdin)
meta = d['chart']['result'][0]['meta']
change = meta['regularMarketPrice'] - meta['chartPreviousClose']
pct = change / meta['chartPreviousClose'] * 100
print(f\"{meta['symbol']}: \${meta['regularMarketPrice']:.2f} ({pct:+.1f}%)\")
"
done
```

## Forex / Exchange Rates

Current rates (base USD):

```bash
curl -s "https://open.er-api.com/v6/latest/USD" | python3 -c "
import sys, json
d = json.load(sys.stdin)
rates = d['rates']
for cur in ['EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'CAD', 'AUD']:
    if cur in rates:
        print(f\"USD → {cur}: {rates[cur]}\")
"
```

Specific conversion:

```bash
curl -s "https://open.er-api.com/v6/latest/USD" | python3 -c "
import sys, json
d = json.load(sys.stdin)
rate = d['rates'].get('EUR', 'N/A')
print(f'1 USD = {rate} EUR')
"
```

## Tips

- CoinGecko free tier: ~30 requests/minute. Don't loop excessively.
- Yahoo Finance is unofficial; results may occasionally be delayed.
- Use `python3 -c` to parse JSON responses for clean output.
- For Chinese yuan, use currency code `CNY`.
- All APIs return JSON; pipe through `python3 -m json.tool` for raw pretty-print.
