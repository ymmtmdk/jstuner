const path = require('path');

module.exports = {
  entry: "./client/main.ts",
  output: {
    path: path.resolve(__dirname, 'public/assets'),
    filename: "bundle.js"
  },

  devtool: "source-map",

  resolve: {
    extensions: ['.ts', '.js']
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ]
  },

  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    publicPath: '/assets/',
    watchContentBase: true
  },
};

