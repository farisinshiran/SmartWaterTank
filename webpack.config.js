const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 1. Memaksa output berjalan murni pada standar web browser
  target: 'web',

  entry: path.resolve(__dirname, 'index.web.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.web.js',
    clean: true,
    chunkFormat: 'array-push',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        // 2. ISOLASI KETAT: Babel HANYA memproses file Anda dan library mobile native yang dibutuhkan.
        // File internal webpack-dev-server otomatis diabaikan agar tidak salah dicompile menjadi CommonJS.
        include: [
          path.resolve(__dirname, 'index.web.js'),
          path.resolve(__dirname, 'App.tsx'), // Sesuaikan jika Anda menggunakan App.js
          path.resolve(__dirname, 'src'),     // Jika Anda memiliki folder src nantinya
          /node_modules\/react-native/,
          /node_modules\/@react-native/,
          /node_modules\/react-native-safe-area-context/
        ],
        use: {
          loader: 'babel-loader',
          // Pengaturan preset diserahkan sepenuhnya ke babel.config.js
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },

  resolve: {
    fullySpecified: false,

    // Prioritas file ekstensi khusus web
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],

    alias: {
      'react-native$': 'react-native-web',
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),

    // Menyuntikkan variabel pembangunan global native
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],

  devServer: {
    port: 8085, // Menggunakan port 8085 agar terhindar dari bentrok EADDRINUSE port lama
    historyApiFallback: true,
    hot: true,
    webSocketServer: 'ws',
  },
};
