import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@shared/theme";
import { useThemeStore } from "@shared/store/theme.store";
import { getAccessToken } from "@core/api/tokens";
import { env } from "@core/config/env";
import type { ChartInterval } from "@features/charts/hooks/useHistory";

// The FULL licensed TradingView Charting Library — the SAME one the web
// terminal uses (served publicly at https://hindenburgindia.live/charting_library/).
// Loaded in a WebView with a custom datafeed that pulls candles from OUR
// backend `/history` endpoint (which already routes crypto→Binance,
// forex→Yahoo, Indian→Zerodha, crypto-options→Bybit internally). This gives
// indicators, drawing tools, fullscreen and every TradingView feature on
// EVERY instrument — unlike the free widget (no NSE, limited tools) or
// Lightweight Charts (no indicators). Works for Indian + crypto + forex +
// options because the backend history endpoint serves them all.

const LIB_HOST = "https://hindenburgindia.live";

interface Props {
  /** Instrument token the backend /history endpoint understands. */
  token: string;
  /** Display symbol for the chart header. */
  symbol: string;
  interval: ChartInterval;
}

function tvResolution(i: ChartInterval): string {
  switch (i) {
    case "1":
      return "1";
    case "5":
      return "5";
    case "15":
      return "15";
    case "60":
      return "60";
    case "1D":
      return "1D";
  }
}

function buildHtml(args: {
  token: string;
  symbol: string;
  interval: string;
  theme: "light" | "dark";
  apiUrl: string;
  jwt: string;
}): string {
  const { token, symbol, interval, theme, apiUrl, jwt } = args;
  const bg = theme === "dark" ? "#0d0d0d" : "#ffffff";
  // Everything below runs INSIDE the WebView. The datafeed talks to our
  // backend with the user's JWT; the widget config mirrors the web terminal.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html,body{margin:0;padding:0;height:100%;width:100%;background:${bg};overflow:hidden;}
  #tv_chart{position:absolute;inset:0;}
  #msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    color:${theme === "dark" ? "#8a86a8" : "#666"};font:13px -apple-system,Roboto,sans-serif;}
</style>
<script src="${LIB_HOST}/charting_library/charting_library.js"></script>
</head>
<body>
<div id="tv_chart"></div>
<div id="msg">Loading chart…</div>
<script>
var API = ${JSON.stringify(apiUrl)};
var JWT = ${JSON.stringify(jwt)};
var TOKEN = ${JSON.stringify(token)};
var DISPLAY = ${JSON.stringify(symbol)};
var THEME = ${JSON.stringify(theme)};

var RES_TO_API = { "1":"minute", "5":"5minute", "15":"15minute", "60":"60minute", "1D":"day", "D":"day" };
var DAYS_FOR_RES = { "1":7, "5":15, "15":30, "60":90, "1D":365, "D":365 };
var SUBS = {};

function toBars(rows){
  var out = [];
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    var t = (r.time!=null) ? Number(r.time) : (r.date ? Math.floor(Date.parse(r.date)/1000) : 0);
    if (!t) continue;
    var ms = t > 1e12 ? t : t*1000;   // library wants ms
    var c = Number(r.close);
    if (!isFinite(c)) continue;
    out.push({ time: ms, open:Number(r.open), high:Number(r.high), low:Number(r.low), close:c, volume:Number(r.volume||0) });
  }
  out.sort(function(a,b){return a.time-b.time;});
  return out;
}

async function fetchHistory(interval, days){
  var url = API + "/api/v1/user/instruments/" + encodeURIComponent(TOKEN) + "/history?interval=" + interval + "&days=" + days;
  var resp = await fetch(url, { headers: { "Authorization": "Bearer " + JWT } });
  var json = await resp.json();
  return toBars((json && json.data) ? json.data : []);
}

// Magnitude-aware price scale so forex (0.65) / crypto show enough decimals.
function priceScaleFor(){
  var t = (TOKEN||"").toUpperCase();
  if (/^\\d+$/.test(t)) return 100;                 // Zerodha numeric → 2dp
  if (/(USDT|USDC|BUSD)$/.test(t)) return 100;       // BTC/ETH big numbers → 2dp
  if (/(USD|JPY|EUR|GBP|INR)$/.test(t)) return 100000; // forex → 5dp
  return 100;
}

var datafeed = {
  onReady: function(cb){ setTimeout(function(){ cb({ supported_resolutions:["1","5","15","60","1D"], supports_time:true }); }, 0); },
  searchSymbols: function(_a,_b,_c,onResult){ onResult([]); },
  resolveSymbol: function(name, onResolve){
    setTimeout(function(){
      onResolve({
        name: DISPLAY, "full_name": DISPLAY, ticker: TOKEN, description: DISPLAY,
        type: "crypto", session: "24x7", timezone: "Asia/Kolkata",
        minmov: 1, pricescale: priceScaleFor(),
        has_intraday: true, has_daily: true, has_weekly_and_monthly: true,
        supported_resolutions: ["1","5","15","60","1D"],
        volume_precision: 2, data_status: "streaming",
      });
    }, 0);
  },
  getBars: async function(symbolInfo, resolution, periodParams, onResult, onError){
    try {
      var interval = RES_TO_API[resolution] || "5minute";
      var days = DAYS_FOR_RES[resolution] || 15;
      var bars = await fetchHistory(interval, days);
      onResult(bars, { noData: bars.length === 0 });
    } catch (e) { onError(String(e)); }
  },
  subscribeBars: function(symbolInfo, resolution, onTick, guid){
    var interval = RES_TO_API[resolution] || "5minute";
    SUBS[guid] = setInterval(async function(){
      try {
        var bars = await fetchHistory(interval, 1);
        if (bars.length) onTick(bars[bars.length-1]);
      } catch(e){}
    }, 8000);
  },
  unsubscribeBars: function(guid){ if (SUBS[guid]) { clearInterval(SUBS[guid]); delete SUBS[guid]; } },
};

function post(o){ try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }

function init(tries){
  if (typeof TradingView === "undefined" || !TradingView.widget){
    if ((tries||0) > 120) { document.getElementById("msg").textContent = "Chart failed to load."; post({type:"libFailed"}); return; }
    return setTimeout(function(){ init((tries||0)+1); }, 50);
  }
  document.getElementById("msg").style.display = "none";
  var isDark = THEME === "dark";
  new TradingView.widget({
    container: "tv_chart",
    datafeed: datafeed,
    symbol: TOKEN,
    interval: ${JSON.stringify(interval)},
    library_path: "${LIB_HOST}/charting_library/",
    locale: "en",
    fullscreen: false,
    autosize: true,
    theme: isDark ? "dark" : "light",
    timezone: "Asia/Kolkata",
    disabled_features: ["use_localstorage_for_settings","header_symbol_search","header_compare","study_templates","chart_storage"],
    enabled_features: ["header_indicators","header_settings","header_fullscreen_button","left_toolbar","timeframes_toolbar","header_resolutions"],
    overrides: {
      "mainSeriesProperties.candleStyle.upColor": "#2bca6a",
      "mainSeriesProperties.candleStyle.downColor": "#ec5d6f",
      "mainSeriesProperties.candleStyle.wickUpColor": "#2bca6a",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ec5d6f",
      "mainSeriesProperties.candleStyle.borderUpColor": "#2bca6a",
      "mainSeriesProperties.candleStyle.borderDownColor": "#ec5d6f",
      "mainSeriesProperties.priceLineVisible": true,
      "paneProperties.background": isDark ? "#0d0d0d" : "#ffffff",
      "paneProperties.backgroundType": "solid",
    },
    loading_screen: { backgroundColor: isDark ? "#0d0d0d" : "#ffffff" },
  });
  post({type:"ready"});
}
init(0);
</script>
</body>
</html>`;
}

function LicensedTVChartImpl({ token, symbol, interval }: Props) {
  const resolved = useThemeStore((s) => s.resolved);
  const theme: "light" | "dark" = resolved === "light" ? "light" : "dark";
  const jwt = getAccessToken() ?? "";

  const html = useMemo(
    () =>
      buildHtml({
        token,
        symbol,
        interval: tvResolution(interval),
        theme,
        apiUrl: env.API_URL,
        jwt,
      }),
    [token, symbol, interval, theme, jwt],
  );

  return (
    <View style={styles.root}>
      <WebView
        key={`${token}|${interval}|${theme}`}
        originWhitelist={["*"]}
        source={{ html, baseUrl: `${LIB_HOST}/` }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        startInLoadingState={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1, backgroundColor: colors.bg },
});

export const LicensedTVChart = memo(LicensedTVChartImpl);
