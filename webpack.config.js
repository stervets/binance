const path                = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin   = require('copy-webpack-plugin');
const TerserPlugin        = require('terser-webpack-plugin');
const webpack             = require('webpack');

module.exports = {
    entry: './src/main.js',
    mode : 'development',
    //mode: 'production',
    output   : {
        path    : path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve  : {
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    module   : {
        rules: [
            {
                test  : /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test  : /\.css$/,
                loader: 'css-loader'
            },
            {
                test: /\.less$/,
                use : [
                    'vue-style-loader',
                    'css-loader',
                    'less-loader'
                ]
            },
            {
                test: /worker\.js$/,
                use : {
                    loader: 'raw-loader'
                }
            }
        ]
    },
    plugins  : [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__  : true,
            __VUE_PROD_DEVTOOLS__: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/public', to: '' }
            ],
        })
    ],
    devServer: {
        static : {
            directory: path.join(__dirname, 'dist'),
        },
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        proxy  : {
            '/socket.io': {
                target      : 'https://ws-feed.pro.coinbase.com',
                ws          : true,
                changeOrigin: true
            }
        },
        port   : 9000,
        open   : false
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel     : true
            }),
        ],
    }
};
