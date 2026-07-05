module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated (palier animations). Keep last.
      'react-native-reanimated/plugin',
    ],
  };
};
