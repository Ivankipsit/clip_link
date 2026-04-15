const {
  AndroidConfig,
  withAndroidManifest,
  withInfoPlist,
} = require("expo/config-plugins");

function withShareTarget(config) {
  // Android: Add intent filter for receiving shared text/URLs
  config = withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      config.modResults,
    );

    const shareIntentFilter = {
      action: [{ $: { "android:name": "android.intent.action.SEND" } }],
      category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
      data: [{ $: { "android:mimeType": "text/plain" } }],
    };

    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    }

    // Avoid duplicate
    const alreadyExists = mainActivity["intent-filter"].some(
      (f) =>
        f.action?.[0]?.$?.["android:name"] === "android.intent.action.SEND",
    );

    if (!alreadyExists) {
      mainActivity["intent-filter"].push(shareIntentFilter);
    }

    return config;
  });

  // iOS: Add share extension URL scheme
  config = withInfoPlist(config, (config) => {
    // Ensure the app group is set for share extension communication
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // Add NSAppTransportSecurity to allow loading shared URLs
    if (!config.modResults.NSAppTransportSecurity) {
      config.modResults.NSAppTransportSecurity = {
        NSAllowsArbitraryLoads: true,
      };
    }

    return config;
  });

  return config;
}

module.exports = withShareTarget;
