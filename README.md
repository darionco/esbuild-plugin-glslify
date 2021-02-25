# esbuild-plugin-glslify
**NOTE: this plugin is based on [rollup-plugin-glslify](https://github.com/glslify/rollup-plugin-glslify)**

An [esbuild](https://esbuild.github.io/) [plugin](https://esbuild.github.io/plugins/) to import GLSL strings with [glslify](https://github.com/glslify/glslify) (a node.js-style module system for GLSL).

```js
import frag from './shaders/frag.glsl';
console.log(frag);
```

## Installation

yarn:
```sh
yarn add esbuild-plugin-glslify --dev
````

NPM:
```sh
npm install --save-dev esbuild-plugin-glslify
```

## Usage

```js
import { build } from 'esbuild';
import { glslify } from 'esbuild-plugin-glslify';

build({
	entryPoints: ['input.js'],
	outfile: 'output.js',
	bundle: true,
	plugins: [glslify({
        extensions: [ 'vs', 'fs', '.glsl', '.frag.shader' ],
		compress: true,
	})],
}).catch(e => {
    console.error(e);
    process.exit(1);
});
```
## Configuration
The plugin responds to the following configuration options:
```javascript
glslify({
    extensions: string[],   // a list of the file extensions this plugin should process.
                            // DEFAULT: [ 'vs', 'fs', 'vert', 'frag', 'glsl' ]
    
    compress: boolean,      // should the finial output be compressed (minified)
                            // DEFAULT: false 
});
```

Any unrecognized options will be forwarded to the [glslify](https://github.com/glslify/glslify) compiler:
```javascript
glslify({
    transform: ['glslify-import'],  // this will configure glslify to import the `glslify-import` module
});
```
Read the [glslify API options](https://github.com/glslify/glslify#var-src--glslcompilesrc-opts) for more information.

## See also

* [rollup-plugin-glslify](https://github.com/glslify/rollup-plugin-glslify)

