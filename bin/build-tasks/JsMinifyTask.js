"use strict";
const UglifyJS = require("uglify-js");
module.exports = function jsMinifyTask(input) {
    return new Promise((ok, reject) => {
        let option;
        if (input.map) {
            option = {
                sourceMap: {
                    content: input.map
                }
            };
        }
        let result = UglifyJS.minify({
            [input.fileName]: input.code
        }, option);
        if (result.error) {
            reject(result.error);
        }
        else {
            ok(result);
        }
    });
};
