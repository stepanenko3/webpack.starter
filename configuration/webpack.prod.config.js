/* eslint-disable import/no-extraneous-dependencies */
const { merge } = require('webpack-merge');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const webpackConfiguration = require('../webpack.config');

const buildWebpackConfig = merge(webpackConfiguration, {
    mode: 'production',

    cache: {
        type: 'filesystem',
    },

    module: {
        unsafeCache: true,
    },

    /* Manage source maps generation process. Refer to https://webpack.js.org/configuration/devtool/#production */
    devtool: false,

    /* Optimization configuration */
    optimization: {
        minimize: true,
        sideEffects: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
            }),
            new CssMinimizerPlugin(),
        ],
    },

    /* Performance treshold configuration values */
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },

    /* Additional plugins configuration */
    plugins: [],
});

module.exports = new Promise((resolve) => {
    resolve(buildWebpackConfig);
});
