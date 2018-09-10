/**
 * Returns strongly-typed, directory agnostic loaders path.
 */
export let loaders = {
    typescript: require.resolve('./CoreTypeScriptLoader'),
    template: require.resolve('./TemplateLoader'),
    babel: require.resolve('babel-loader'),
    vue: require.resolve('vue-loader'),
    vueStyle: require.resolve('vue-style-loader'),
    css: require.resolve('css-loader')
}
