const { HotModuleReplacementPlugin } = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
const devConfig = {
    mode: 'development',
    devServer: {
        historyApiFallback: true,
        port: 8080,
        open: true,
    },
    target: 'web',
    plugins: [new HotModuleReplacementPlugin()],
    devtool: 'eval-source-map',
};

module.exports = merge(common, devConfig);