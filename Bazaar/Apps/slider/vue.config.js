module.exports = {
    devServer: {
        hot: false,
        liveReload: false
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
    publicPath: '/Bazaar/Apps/slider/dist/'
}