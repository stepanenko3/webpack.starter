/**
 * Webpack main configuration file
 */

const path = require('path');
const glob = require('glob');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const UglifyJS = require('uglify-es');
const PurgecssPlugin = require('purgecss-webpack-plugin');

const IconfontPlugin = require('iconfont-plugin-webpack');
const iconfontTemplate = require('./configuration/iconfont.template.conf');

const environment = require('./configuration/environment');

const isDev = process.argv[process.argv.indexOf('--mode') + 1] === 'development';

const templateFiles = fs.readdirSync(environment.paths.source)
    .filter((file) => path.extname(file).toLowerCase() === '.html');

const htmlPluginEntries = templateFiles.map((template) => new HTMLWebpackPlugin({
    inject: true,
    hash: false,
    filename: template,
    template: path.resolve(environment.paths.source, template),
    favicon: path.resolve(environment.paths.source, 'assets', 'img', 'favicon.ico'),
    output: {
        path: path.resolve(environment.paths.output, template),
    },
}));

module.exports = {
    entry: {
        app: path.resolve(environment.paths.source, 'assets', 'js', 'app.js'),
    },
    output: {
        filename: 'assets/js/[name].js',
        chunkFilename: 'assets/js/[name].js',
        path: environment.paths.output,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                include: [],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', ['minify', {
                            modules: false,
                            loose: true,
                        }]],
                    },
                },
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: path.resolve(environment.paths.output, 'assets', 'fonts'),
                        },

                        // loader: 'url-loader',
                        // options: {
                        //     name: 'assets/fonts/[name].[ext]',
                        //     publicPath: '../',
                        //     limit: environment.limits.fonts,
                        // },
                    },
                ],
            },
            {
                test: /\.(png|gif|jpe?g|svg)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: 'assets/img/design/[name].[ext]',
                            publicPath: '../',
                            limit: environment.limits.images,
                        },
                    },
                ],
            },
            {
                test: /\.((c|sa|sc)ss)$/i,
                use: [
                    (isDev ? 'style-loader' : MiniCssExtractPlugin.loader),
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: false,
                            url: true,
                            // modules: true,
                        },
                    }, {
                        loader: 'postcss-loader',
                    }, {
                        loader: 'sass-loader',
                        options: { sourceMap: false },
                    },
                ],
            },
        ],
    },
    plugins: [
        new IconfontPlugin({
            src: path.resolve(environment.paths.source, 'assets', 'icons'),
            // family: 'MainIcons',
            dest: {
                font: path.resolve(environment.paths.source, 'assets', 'fonts', '[family].[type]'),
                css: path.resolve(environment.paths.source, 'assets', 'scss', '_iconfont_[family].scss'),
            },
            watch: {
                pattern: path.resolve(environment.paths.source, 'assets', 'icons', '**', '*.svg'),
            },
            cssTemplate: iconfontTemplate,
        }),

        new MiniCssExtractPlugin({
            filename: 'assets/css/[name].css',
            chunkFilename: 'assets/css/[name].css',
        }),

        new PurgecssPlugin({
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            paths: glob.sync(`${path.resolve(environment.paths.source)}{${[
                '/*.html',
                '/assets/*',
                '/assets/**/*',
            ].join(',')}}`, { nodir: true }),
            safelist: [],
        }),
        new ImageMinimizerPlugin({
            test: /\.(jpe?g|png|gif|svg)$/i,
            minimizerOptions: {
                // Lossless optimization with custom option
                // Feel free to experiment with options for better result for you
                plugins: [
                    ['gifsicle', { interlaced: true }],
                    ['jpegtran', { progressive: true }],
                    ['optipng', { optimizationLevel: 5 }],
                    [
                        'svgo',
                        {
                            overrides: {
                                // customize options for plugins included in preset
                                removeViewBox: {
                                    active: false,
                                },
                            },
                        },
                    ],
                ],
            },
        }),
        new CleanWebpackPlugin({
            verbose: true,
            cleanOnceBeforeBuildPatterns: ['**/*', '!stats.json'],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(environment.paths.source, 'assets', 'img', 'content'),
                    to: path.resolve(environment.paths.output, 'assets', 'img', 'content'),
                    toType: 'dir',
                    globOptions: {
                        ignore: ['*.DS_Store', 'Thumbs.db'],
                    },
                },
                {
                    from: path.resolve(environment.paths.source, 'assets', 'js', 'ads.js'),
                    to: path.resolve(environment.paths.output, 'assets', 'js', 'ads.js'),
                    transform: (content) => UglifyJS.minify(content.toString()).code,
                },
            ],
        }),
    ].concat(htmlPluginEntries),
    target: 'web',
};
