module.exports = {
    devServer: {
        hot: true,
        liveReload: true
    },
    "transpileDependencies": [
        "vuetify"
    ],
    pages: {
        'index': {
            entry: './src/main.js',
            template: 'public/index.html',
            title: 'Presenter',
            chunks: [ 'chunk-vendors', 'chunk-common', 'index' ]
        },
        'display': {
            entry: './src/main_display.js',
            template: 'public/index.html',
            title: 'Display',
            chunks: [ 'chunk-vendors', 'chunk-common', 'display' ]
        }
    },
    publicPath: '/us-e-1/Bazaar/Apps/slider/dist/'
}