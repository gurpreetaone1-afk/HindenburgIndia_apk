// Config plugin: bake the EAS Update channel into AndroidManifest on every
// prebuild. EAS Build injects the channel from eas.json automatically, but our
// LOCAL Gradle builds (`expo prebuild && ./gradlew assembleRelease`) don't — so
// without this a re-prebuild would drop the channel and OTA updates would stop
// resolving. Keeps `expo.modules.updates.EXPO_UPDATES_CHANNEL = preview`.
const { withAndroidManifest } = require("@expo/config-plugins");

const CHANNEL = "preview";
const NAME = "expo.modules.updates.EXPO_UPDATES_CHANNEL";

module.exports = function withUpdatesChannel(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app["meta-data"] = app["meta-data"] || [];
    const existing = app["meta-data"].find(
      (m) => m.$?.["android:name"] === NAME,
    );
    if (existing) {
      existing.$["android:value"] = CHANNEL;
    } else {
      app["meta-data"].push({
        $: { "android:name": NAME, "android:value": CHANNEL },
      });
    }
    return cfg;
  });
};
