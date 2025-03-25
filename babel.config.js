module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'], // Add dotenv plugin
    'react-native-reanimated/plugin', // Keep Reanimated plugin at the end
  ],
};
