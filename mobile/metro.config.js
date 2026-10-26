// Metro, with the website's shared modules in ../lib (lib/household.ts, lib/claims.ts, lib/appApi.ts, lib/types.ts,
// lib/receipts.ts). The "@/lib/*" alias comes from tsconfig.json paths, which Expo's Metro reads. Watching ../lib means
// an edit there reloads the app in development. Only those pure files are imported; nothing server-side.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '..', 'lib')];

module.exports = config;
