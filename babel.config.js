module.exports = function (api) {
  api.cache(true);

  // Mendeteksi apakah proses build saat ini ditujukan untuk kebutuhan Web
  const isWeb = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production';

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
