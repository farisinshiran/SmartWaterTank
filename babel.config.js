module.exports = function (api) {
  // Webpack explicitly selects the "web" Babel environment; native builds keep module transforms enabled.
  const isWeb = api.env() === 'web';

  return {
    presets: [
      [
        '@react-native/babel-preset',
        {
          // KUNCI UTAMA: Jika untuk web, jangan ubah sistem import menjadi 'require'
          disableImportExportTransform: isWeb,
        },
      ],
    ],
  };
};
