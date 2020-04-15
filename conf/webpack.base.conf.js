const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const IconfontPlugin = require('iconfont-plugin-webpack')

const srcName = 'src';
const PATHS = {
    src: path.join(__dirname, '../' + srcName),
    dist: path.join(__dirname, '../dist'),
    assets: 'assets/'
}

module.exports = {
    externals: {
        paths: PATHS
    },
    entry: {
        app: PATHS.src
    },
    output: {
        filename: `${PATHS.assets}js/[name].js`, // [name].[hash].js
        path: PATHS.dist,
        publicPath: '/'
    },
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }, {
            test: /\.(png|jpg|jpeg|gif|svg)$/,
            use: {
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            }
        }, {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: {
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            }
        }, {
            test: /\.s[ac]ss$/i,
            use: [
                'style-loader',
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: { sourceMap: true }
                }, {
                    loader: 'postcss-loader',
                    options: { sourceMap: true, config: { path: `${PATHS.src}/${PATHS.assets}js/postcss.config.js` } }
                }, {
                    loader: 'sass-loader',
                    options: { sourceMap: true }
                },
            ],
        }]
    },
    plugins: [
        new IconfontPlugin({
            src: `${PATHS.src}/${PATHS.assets}icons`,
            // family: 'MainIcons',
            dest: {
                font: `${PATHS.src}/${PATHS.assets}fonts/[family].[type]`,
                css: `${PATHS.src}/${PATHS.assets}scss/_iconfont_[family].scss`,
            },
            watch: {
                pattern: `${srcName}/${PATHS.assets}icons/**/*.svg`,
            },
        }),
        new MiniCssExtractPlugin({
            filename: `${PATHS.assets}css/[name].css` // [name].[hash].css
        }),
        new HtmlWebpackPlugin({
            hash: false,
            template: `${PATHS.src}/index.html`,
            filename: './index.html',
        }),
        new CopyWebpackPlugin([
            { from: `${PATHS.src}/${PATHS.assets}img`, to: `${PATHS.assets}img` },
            { from: `${PATHS.src}/${PATHS.assets}fonts`, to: `${PATHS.assets}fonts` },
        ])
    ]
}