import { LIGHTWEIGHT_CHARTS_B64 } from "./lightweightCharts";

// Inline <script> that decodes the BUNDLED Lightweight Charts build and
// executes it so `window.LightweightCharts` is defined synchronously — with
// ZERO network. Drop this into the WebView HTML in place of the old
// `<script src="https://unpkg.com/lightweight-charts...">` CDN tag. If
// decoding ever fails it posts `{type:'libFailed'}` to RN so the host can
// show an error instead of an infinite spinner.
export const LWC_INLINE_SCRIPT = `<script>
(function(){
  try {
    var src = atob("${LIGHTWEIGHT_CHARTS_B64}");
    var s = document.createElement('script');
    s.text = src;
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'libFailed', message: String(e) }));
    } catch (_) {}
  }
})();
</script>`;
