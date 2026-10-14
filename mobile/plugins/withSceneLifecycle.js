// iOS 27 SDK: UIKit stops an app at launch unless it adopts the scene life cycle (crash in
// _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption, TestFlight 0.1.0 (1), 14 Oct 2026).
// Expo SDK 57 ships the scene delegate (ExpoAppSceneDelegate, Objective-C name EXExpoAppSceneDelegate), but the
// prebuild template doesn't use it yet. This plugin wires it in when `npx expo prebuild` generates ios/:
// - Info.plist: a single-scene manifest that names EXExpoAppSceneDelegate;
// - AppDelegate.swift: conforms to ExpoReactNativeFactoryProvider and no longer makes its own window, because the
//   scene delegate creates the window and starts React Native in it.
// Remove this plugin once Expo's template does this itself.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

function replaceOnce(src, find, replacement, what) {
  if (src.includes(replacement)) return src;
  if (!src.includes(find)) throw new Error(`withSceneLifecycle: couldn't find ${what} in AppDelegate.swift; check the Expo template`);
  return src.replace(find, replacement);
}

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: 'EXExpoAppSceneDelegate' },
        ],
      },
    };
    return c;
  });

  return withAppDelegate(config, (c) => {
    if (c.modResults.language !== 'swift') throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    let src = c.modResults.contents;
    src = replaceOnce(src, 'class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {', 'the AppDelegate class line');
    src = replaceOnce(
      src,
      `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`,
      `    // The window and React Native start in the scene delegate (EXExpoAppSceneDelegate, plugins/withSceneLifecycle.js).
`,
      'the window/startReactNative block',
    );
    c.modResults.contents = src;
    return c;
  });
};
