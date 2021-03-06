"use strict";
const html_minifier_1 = require("html-minifier");
const vue_template_compiler_1 = require("vue-template-compiler");
const source_map_1 = require("source-map");
const Shout_1 = require("../Shout");
let minifierOptions = {
    caseSensitive: false,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,
    conservativeCollapse: true,
    decodeEntities: false,
    html5: true,
    includeAutoGeneratedTags: true,
    keepClosingSlash: false,
    minifyCSS: false,
    minifyJS: false,
    minifyURLs: false,
    preserveLineBreaks: false,
    preventAttributesEscaping: false,
    processConditionalComments: false,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: false,
    removeEmptyElements: false,
    removeOptionalTags: false,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: false,
    sortAttributes: true,
    sortClassName: true,
    trimCustomFragments: false,
    useShortDoctype: false
};
function functionWrap(s) {
    return 'function(){' + s + '}';
}
function functionArrayWrap(ar) {
    let result = ar.map(s => functionWrap(s)).join(',');
    return '[' + result + ']';
}
let deprecateVueHtmlWarned = false;
module.exports = function (html) {
    let template = html_minifier_1.minify(html, minifierOptions).trim();
    let fileName = this.resourcePath.toLowerCase();
    if (fileName.endsWith('.vue.html')) {
        if (deprecateVueHtmlWarned === false) {
            Shout_1.Shout.warning('Importing .vue.html module is deprecated in favor of .vue Single-File Components (which supports Hot Reload Development Mode) and will be removed in future instapack version 7.0.0!');
            deprecateVueHtmlWarned = true;
        }
        let vueResult = vue_template_compiler_1.compile(template);
        let error = vueResult.errors[0];
        if (error) {
            this.callback(Error(error));
            return;
        }
        template = '{render:' + functionWrap(vueResult.render)
            + ',staticRenderFns:' + functionArrayWrap(vueResult.staticRenderFns)
            + '}';
    }
    else {
        template = JSON.stringify(template);
    }
    template = 'module.exports = ' + template;
    if (this.sourceMap) {
        let gen = new source_map_1.SourceMapGenerator({
            file: this.resourcePath + '.js'
        });
        gen.addMapping({
            source: this.resourcePath,
            generated: {
                column: 0,
                line: 1
            },
            original: {
                column: 0,
                line: 1
            }
        });
        gen.setSourceContent(this.resourcePath, html);
        let sm = gen.toJSON();
        this.callback(null, template, sm);
    }
    else {
        this.callback(null, template);
    }
};
