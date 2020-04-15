module.exports = {
    plugins: (loader) => [,
        require('autoprefixer'),
        require('css-mqpacker'),
        require('cssnano')({
            preset: [
                'default', {
                    dicardComments: {
                        removeAll: true,
                    }
                }
            ]
        })
    ]
}