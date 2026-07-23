// Config plugin: cut native-build memory + time so `eas build --local` can
// finish on a 16 GB machine. A full managed prebuild compiles the New-Arch C++
// for ALL FOUR ABIs in parallel, which OOM-kills the Gradle daemon (seen as
// "Could not stop all services" after ~40 min). Two levers fix that:
//   1. Build ONLY arm64-v8a — every real Android phone is arm64, so dropping
//      armeabi-v7a/x86/x86_64 removes ~75% of the C++ compilation.
//   2. Serialize Gradle (no parallel modules, single worker) so peak memory
//      stays bounded, and give the daemon a bigger heap so it doesn't die.
// These are applied during prebuild, so they survive the fresh android/ that
// EAS regenerates for a managed build.
const { withGradleProperties } = require("@expo/config-plugins");

const OVERRIDES = {
  reactNativeArchitectures: "arm64-v8a",
  "org.gradle.parallel": "false",
  "org.gradle.workers.max": "2",
  // NOTE: configure-on-demand is deliberately OFF. It breaks React Native +
  // New Arch codegen ordering — the app's CMake configures before dependent
  // libraries (async-storage, gesture-handler, webview) generate their JNI
  // codegen dirs, giving "add_subdirectory ... is not an existing directory".
  "org.gradle.jvmargs": "-Xmx3072m -XX:MaxMetaspaceSize=768m -XX:+UseParallelGC",
};

module.exports = function withBuildTuning(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    for (const [key, value] of Object.entries(OVERRIDES)) {
      const existing = props.find((p) => p.type === "property" && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: "property", key, value });
      }
    }
    return cfg;
  });
};
