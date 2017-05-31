const path = require('path');

module.exports = {
  entry: "./client/main.ts",
  output: {
    path: path.resolve(__dirname, 'public/assets'),
    filename: "bundle.js"
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  },
  devtool: "source-map",
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    publicPath: '/assets/',
    watchContentBase: true
  },
};

