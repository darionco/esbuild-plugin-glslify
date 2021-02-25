/**
 * Based on https://github.com/glslify/rollup-plugin-glslify
 */
'use strict';

import { dirname } from 'path';
import * as _glslify from 'glslify';

function compressShader(code) {
    let needNewline = false;
    return code.replace(/\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/g, '').split(/\n+/).reduce((result, line) => {
        line = line.trim().replace(/\s{2,}|\t/, ' ');
        if (line.charAt(0) === '#') {
            if (needNewline) {
                result.push('\n');
            }
            result.push(line, '\n');
            needNewline = false;
        } else {
            result.push(line.replace(/\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|;)\s*/g, '$1'));
            needNewline = true;
        }
        return result;
    }, []).join('').replace(/\n+/g, '\n');
}

const kDefaultConfig = {
    extensions: [
        'vs',
        'fs',
        'vert',
        'frag',
        'glsl',
    ],
    compress: false,
};

function createFilter(extensions) {
    let expression = `\\.(?:${
        extensions.map(e => e.split('.').filter(s => Boolean(s)).join('\\.')).join('|')
    })$`;
    return new RegExp(expression);
}

function glslify(options) {
    const config = Object.assign({}, kDefaultConfig, options);
    const filter = createFilter(config.extensions);

    return {
        name: 'glslify',
        setup(build) {
            // unfortunately glslify is not async
            build.onLoad({ filter }, async (args) => {
                const fileOptions = Object.assign({
                    basedir: dirname(args.path),
                }, config);

                const code = _glslify.default.file(args.path, fileOptions);

                return {
                    contents: config.compress ? compressShader(code) : code,
                    loader: 'text',
                };
            });
        }
    }
}

export { glslify, glslify as default };
