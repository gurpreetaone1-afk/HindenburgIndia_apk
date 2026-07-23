import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@shared/theme";
import { useThemeStore } from "@shared/store/theme.store";
import type { ChartInterval } from "@features/charts/hooks/useHistory";

// TradingView's FREE "Advanced Chart" embed — the exact widget the web
// terminal uses (frontend-user/components/trading/TradingViewAdvancedWidget).
// It renders TradingView's OWN data feed, so Infoway forex / crypto / metals /
// energy / indices charts always have candles — no dependence on our /history
// endpoint (which returned "No candles available for GOLD yet"). The widget
// keeps TradingView's attribution as required by their free-widget terms.

interface Props {
  /** TradingView symbol, e.g. "OANDA:XAUUSD", "BINANCE:BTCUSDT", "TVC:GOLD",
   * "NSE:NIFTY". Comes from `toTradingViewSymbol()`. */
  tvSymbol: string;
  interval: ChartInterval;
}

function tvInterval(i: ChartInterval): string {
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
      return "D";
  }
}

function buildHtml(symbol: string, interval: string, theme: "light" | "dark"): string {
  const bg = theme === "dark" ? "#0d0d0d" : "#ffffff";
  const config = JSON.stringify({
    symbol,
    interval,
    theme,
    style: "1", // candles
    locale: "en",
    timezone: "Asia/Kolkata",
    autosize: true,
    // Keep the TOP toolbar so the "Indicators" button is available (user
    // asked for indicators like the web). Side toolbar (drawing tools) stays
    // hidden to save horizontal space on mobile — it can be opened from the
    // top toolbar when needed.
    hide_top_toolbar: false,
    hide_side_toolbar: true,
    hide_legend: false,
    // A couple of sensible default studies so a chart isn't bare on open.
    studies: ["STD;Volume"],
    allow_symbol_change: false,
    save_image: false,
    withdateranges: false,
    details: false,
    calendar: false,
    support_host: "https://www.tradingview.com",
  });
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html,body { margin:0; padding:0; height:100%; width:100%; background:${bg}; overflow:hidden; }
  .tradingview-widget-container,
  .tradingview-widget-container__widget { height:100%; width:100%; }
  .tradingview-widget-copyright { display:none; }
</style>
</head>
<body>
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
  ${config}
  </script>
</div>
</body>
</html>`;
}

function TVAdvancedChartImpl({ tvSymbol, interval }: Props) {
  const resolved = useThemeStore((s) => s.resolved);
  const theme: "light" | "dark" = resolved === "light" ? "light" : "dark";
  const html = useMemo(
    () => buildHtml(tvSymbol, tvInterval(interval), theme),
    [tvSymbol, interval, theme],
  );

  return (
    <View style={styles.root}>
      <WebView
        // Remount whenever the symbol / interval / theme changes so the embed
        // re-initialises cleanly with the new config.
        key={`${tvSymbol}|${interval}|${theme}`}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://www.tradingview.com/" }}
        javaScriptEnabled
        domStorageEnabled
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

export const TVAdvancedChart = memo(TVAdvancedChartImpl);
