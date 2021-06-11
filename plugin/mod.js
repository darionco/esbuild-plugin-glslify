/**
 * Based on https://github.com/glslify/rollup-plugin-glslify
 */
'use strict';

import { dirname } from 'path';
import { promises as fsPromises } from 'fs';
import * as _glslify from 'glslify';
import GlslMinify from './minify.js';

let GlslMinifyInstance;
async function compressShader(code) {
    // Code adapted from https://github.com/leosingleton/webpack-glsl-minify
    GlslMinifyInstance = GlslMinifyInstance || new GlslMinify();
    return await GlslMinifyInstance.executeFile({ contents: code }).sourceCode;
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

    let requireIndex = 0;

    console.log(typeof webpackGlslMinify, Object.keys(webpackGlslMinify), webpackGlslMinify);

    return {
        name: 'glslify',
        setup(build) {
            // unfortunately glslify is not async
            build.onLoad({ filter }, async (args) => {
                const contents = await fsPromises.readFile(args.path, 'utf8');

                const fileOptions = Object.assign({
                    basedir: dirname(args.path),
                }, config);

                let code = '';
                try {
                    code = _glslify.default.compile(contents, fileOptions);
                } catch (err) {
                    console.log('Compilation failed', args.path);
                    console.log(err);
                }

                if (contents.includes('require(')) {
                    if (requireIndex === 0) {
                        console.log('contents:\n', contents);
                        console.log('code:\n', code);
                    }
                    requireIndex++;
                }

                return {
                    contents: config.compress ? await compressShader(code) : code,
                    loader: 'text',
                };
            });
        }
    }
}

export { glslify, glslify as default };
