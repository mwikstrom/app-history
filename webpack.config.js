const webpack = require("webpack");
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const LIBRARY_NAME = "AppHistory";

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "app-history.js",
        library: LIBRARY_NAME,
        libraryTarget: "umd"
    },
    devtool: "source-map",
    externals: [
        "history"
    ],
    resolve: {
        extensions: [
            ".ts",
            ".js"
        ]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]     
    },
    plugins: [
        new CleanWebpackPlugin(["dist"]),
        new DtsBundlePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true
        })
    ]
};

function DtsBundlePlugin(){}
DtsBundlePlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', function(){
    var dts = require('dts-bundle');

    dts.bundle({
      name: LIBRARY_NAME,
      main: path.resolve(__dirname, "dist/index.d.ts"),
      out: path.resolve(__dirname, "dist/app-history.d.ts"),
      removeSource: true,
      outputAsModuleFolder: true
    });
  });
};