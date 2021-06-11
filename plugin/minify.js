// Transpiled from https://github.com/leosingleton/webpack-glsl-minify/blob/master/src/minify.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
/* eslint-disable */

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

const glslTypes = [
  // Basic types
  'bool', 'double', 'float', 'int', 'uint',
  // Vector types
  'vec2', 'vec3', 'vec4',
  'bvec2', 'bvec3', 'bvec4',
  'dvec2', 'dvec3', 'dvec4',
  'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4',
  // Matrix types
  'mat2', 'mat2x2', 'mat2x3', 'mat2x4',
  'mat3', 'mat3x2', 'mat3x3', 'mat3x4',
  'mat4', 'mat4x2', 'mat4x3', 'mat4x4',
  // Sampler types
  'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube', 'sampler2DRect',
  'isampler1D', 'isampler2D', 'isampler3D', 'isamplerCube', 'isampler2DRect',
  'usampler1D', 'usampler2D', 'usampler3D', 'usamplerCube', 'usampler2DRect',
  'sampler1DArray', 'sampler2DArray', 'samplerCubeArray',
  'isampler1DArray', 'isampler2DArray', 'isamplerCubeArray',
  'usampler1DArray', 'usampler2DArray', 'usamplerCubeArray',
  'samplerBuffer', 'sampler2DMS', 'sampler2DMSArray',
  'isamplerBuffer', 'isampler2DMS', 'isampler2DMSArray',
  'usamplerBuffer', 'usampler2DMS', 'usampler2DMSArray',
  'sampler1DShadow', 'sampler2DShadow', 'samplerCubeShadow', 'sampler2DRectShadow', 'sampler1DArrayShadow',
  'sampler2DArrayShadow', 'samplerCubeArrayShadow',
  'void'
];
const glslTypeQualifiers = [
  // Other type-related keywords
  'attribute', 'const', 'invariant', 'struct', 'uniform', 'varying',
  // Precision keywords
  'highp', 'lowp', 'mediump', 'precision',
  // Input/output keywords
  'in', 'inout', 'out',
  // Interpolation qualifiers
  'flat', 'noperspective', 'smooth', 'centroid', 'sample',
  // Memory qualifiers
  'coherent', 'volatile', 'restrict', 'readonly', 'writeonly'
];
const glslConstantValues = [
  'false', 'true',
  // Built-in macros
  '__FILE__', '__LINE__', '__VERSION__', 'GL_ES', 'GL_FRAGMENT_PRECISION_HIGH'
];
const glslControlKeywords = [
  // Control keywords
  'break', 'continue', 'do', 'else', 'for', 'if', 'main', 'return', 'while',
  'discard'
];
const glslBuiltinFunctions = [
  // Trig functions
  'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cos', 'cosh', 'degrees', 'radians', 'sin', 'sinh', 'tan', 'tanh',
  // Exponents and logarithms
  'exp', 'exp2', 'inversesqrt', 'log', 'log2', 'pow', 'sqrt',
  // Clamping and modulus-related funcions
  'abs', 'ceil', 'clamp', 'floor', 'fract', 'max', 'min', 'mod', 'modf', 'round', 'roundEven', 'sign', 'trunc',
  // Floating point functions
  'isinf', 'isnan',
  // Boolean functions
  'all', 'any', 'equal', 'greaterThan', 'greaterThanEqual', 'lessThan', 'lessThanEqual', 'not', 'notEqual',
  // Vector functions
  'cross', 'distance', 'dot', 'faceforward', 'length', 'outerProduct', 'normalize', 'reflect', 'refract',
  // Matrix functions
  'determinant', 'inverse', 'matrixCompMult',
  // Interpolation functions
  'mix', 'step', 'smoothstep',
  // Texture functions
  'texture2D', 'texture2DProj', 'textureCube', 'textureSize',
  // Noise functions
  'noise1', 'noise2', 'noise3', 'noise4',
  // Derivative functions
  'dFdx', 'dFdxCoarse', 'dFdxFine',
  'dFdy', 'dFdyCoarse', 'dFdyFine',
  'fwidth', 'fwidthCoarse', 'fwidthFine'
];
/** List of GLSL reserved keywords to avoid mangling. We automatically include any gl_ variables. */
const glslReservedKeywords = [].concat(glslTypes, glslTypeQualifiers, glslConstantValues, glslControlKeywords, glslBuiltinFunctions);
/**
 * Helper class to minify tokens and track reserved ones
 */
class TokenMap {
  constructor(options) {
    this.options = options;
    /**
     * The underlying token map itself. Although the data type is GlslUniform, it is used for all tokens, not just
     * uniforms. The type property of GlslUniform is only set for uniforms, however.
     */
    this.tokens = {};
    /**
     * Number of tokens minified. Used to generate unique names. Although we could be more sophisticated, and count
     * usage, we simply assign names in order. Few shaders have more than 52 variables (the number of single-letter
     * variable names), so simple is good enough.
     */
    this.minifiedTokenCount = 0;
    // GLSL has many reserved keywords. In order to not minify them, we add them to the token map now.
    this.reserveKeywords(glslReservedKeywords);
  }
  /**
   * Adds keywords to the reserved list to prevent minifying them.
   * @param keywords Array of strings containing keywords to preserve
   */
  reserveKeywords(keywords) {
    for (const keyword of keywords) {
      if (!this.tokens[keyword]) {
        this.tokens[keyword] = { variableType: undefined, variableName: keyword };
      }
    }
  }
  /**
   * Converts a token number to a name
   */
  static getMinifiedName(tokenCount) {
    const num = tokenCount % 52;
    const offset = (num < 26) ? (num + 65) : (num + 71); // 65 = 'A'; 71 = ('a' - 26)
    const c = String.fromCharCode(offset);
    // For tokens over 52, recursively add characters
    const recurse = Math.floor(tokenCount / 52);
    return (recurse === 0) ? c : (this.getMinifiedName(recurse - 1) + c);
  }
  /**
   * Minifies a token
   * @param name Token name
   * @param uniformType If the token is a uniform, the data type
   * @returns Minified token name
   */
  minifyToken(name, uniformType) {
    // Check whether the token already has an existing minified value
    const existing = this.tokens[name];
    if (existing) {
      // In the case of a uniform with mangling explicitly disabled, we may already have an entry from the @nomangle
      // directive. But still store the type.
      if (uniformType) {
        existing.variableType = uniformType;
      }
      return existing.variableName;
    }
    // Mangle the name. Special-case any tokens starting with "gl_". They should never be minified. Likewise, never
    // mangle substitution values, which start and end with "$".
    let min = name;
    if (!this.options.preserveAll && !name.startsWith('gl_') && name.indexOf('$') === -1) {
      min = TokenMap.getMinifiedName(this.minifiedTokenCount++);
    }
    // Allocate a new value
    this.tokens[name] = {
      variableName: min,
      variableType: uniformType
    };
    return min;
  }
  /**
   * Returns the uniforms and their associated data types
   */
  getUniforms() {
    // Filter only the tokens that have the type field set
    const result = {};
    for (const original in this.tokens) {
      const token = this.tokens[original];
      if (token.variableType) {
        result[original] = token;
      }
    }
    return result;
  }
}

var TokenType = {};
/** A user-created token such as a custom function or variable name */
TokenType["ttToken"] = 0;
/**
* A built-in token in the GLSL language, such as a function or reserved keyword. (Note: types and type qualifiers
* are handled specially below)
*/
TokenType["ttReservedToken"] = 1;
/** A variable type: int, float, vec2, etc. */
TokenType["ttType"] = 2;
/** The attribute keyword */
TokenType["ttAttribute"] = 3;
/** The uniform keyword */
TokenType["ttUniform"] = 4;
/** The varying keyword */
TokenType["ttVarying"] = 5;
/** An operator, including parentheses. (Note: dots, brackets, and semicolons are also special ones below) */
TokenType["ttOperator"] = 6;
/** [ or ] */
TokenType["ttBracket"] = 7;
/** A semicolon */
TokenType["ttSemicolon"] = 8;
/** The dot operator. This operator has special meaning in GLSL due to vector swizzle masks. */
TokenType["ttDot"] = 9;
/** A numeric value */
TokenType["ttNumeric"] = 10;
/** A GLSL preprocessor directive */
TokenType["ttPreprocessor"] = 11;
/** Special value used in the parser when there is no token */
TokenType["ttNone"] = 12;

/** Stub implementation of NodeJS's readFile() API to work in browsers and non-NodeJS environments */
function nullReadFile(_filename, _directory) {
  return new Promise((_resolve, reject) => {
    reject(new Error('Not Supported'));
  });
}
/** Stub implementation of NodeJS's dirname() API to work in browsers and non-NodeJS environments */
function nullDirname(_p) {
  return undefined;
}

/** GLSL shader minifier */
class GlslMinify {
  /**
   * Constructor
   * @param options Minifier options. See GlslMinifyOptions for details.
   * @param readFile Implementation of NodeJS's readFile() API. Three variations are included with the
   *    webpack-glsl-minify package: nodeReadFile() for NodeJS apps, webpackReadFile() for the Webpack plugin, and
   *    nullReadFile() for browsers and other environments that don't support reading files from the local disk.
   * @param dirname Implementation of NodeJS's dirname() API. Two variations are included with the webpack-glsl-minify
   *    package: nodeDirname() for NodeJS and Webpack and nullDirname() for browsers and other environments that don't
   *    support reading files from the local disk.
   */
  constructor(options, readFile = nullReadFile, dirname = nullDirname) {
    this.constValues = {};
    /**
     * Substitution values are of the form "$0$"
     */
    this.substitutionValueCount = 0;
    // If output type is not object, disable mangling as we have no way of returning the map of the mangled names of
    // uniforms.
    options = options || {};
    if (options.output && options.output !== 'object') {
      options.preserveUniforms = true;
    }
    this.options = options;
    this.readFile = readFile;
    this.dirname = dirname;
    this.tokens = new TokenMap(options);
  }
  execute(content) {
    const input = { contents: content };
    return this.executeFile(input);
  }
  executeFile(input) {
    return __awaiter(this, void 0, void 0, function* () {
      // Perform the minification. This takes three separate passes over the input.
      const pass1 = yield this.preprocessPass1(input);
      const pass2 = this.preprocessPass2(pass1);
      const pass3 = this.minifier(pass2);
      return {
        sourceCode: pass3,
        uniforms: this.tokens.getUniforms(),
        consts: this.constValues
      };
    });
  }
  /**
   * The first pass of the preprocessor removes comments and handles include directives
   */
  preprocessPass1(content) {
    return __awaiter(this, void 0, void 0, function* () {

      let output = content.contents;
      // Remove carriage returns. Use newlines only.
      output = output.replace('\r', '');
      // Strip any #version directives
      if (this.options.stripVersion) {
        output = output.replace(/#version.+/, '');
      }
      // Remove C style comments
      const cStyleRegex = /\/\*[\s\S]*?\*\//g;
      output = output.replace(cStyleRegex, '');
      // Remove C++ style comments
      const cppStyleRegex = /\/\/[^\n]*/g;
      output = output.replace(cppStyleRegex, '\n');
      // Process @include directive
      const includeRegex = /@include\s+(.*)/;
      while (true) {
        // Find the next @include directive
        const match = includeRegex.exec(output);
        if (!match) {
          break;
        }
        const includeFilename = JSON.parse(match[1]);
        // Read the file to include
        const currentPath = content.path ? this.dirname(content.path) : undefined;
        const includeFile = yield this.readFile(includeFilename, currentPath);
        // Parse recursively, as the included file may also have @include directives
        const includeContent = yield this.preprocessPass1(includeFile);
        // Replace the @include directive with the file contents
        output = output.replace(includeRegex, includeContent);
      }
      return output;
    });
  }
  assignSubstitionValue(constName, constType) {
    const substitutionValue = `$${this.substitutionValueCount++}$`;
    this.tokens.reserveKeywords([substitutionValue]);
    this.constValues[constName] = {
      variableName: substitutionValue,
      variableType: constType
    };
    return substitutionValue;
  }
  /**
   * The second pass of the preprocessor handles nomange and define directives
   */
  preprocessPass2(content) {
    let output = content;
    // Disable name mangling for keywords provided via options
    if (this.options.nomangle) {
      this.tokens.reserveKeywords(this.options.nomangle);
    }
    // Process @nomangle directives
    const nomangleRegex = /@nomangle\s+(.*)/;
    while (true) {
      // Find the next @nomangle directive
      const match = nomangleRegex.exec(output);
      if (!match) {
        break;
      }
      // Record the keywords
      const keywords = match[1].split(/\s/);
      this.tokens.reserveKeywords(keywords);
      // Remove the @nomangle line
      output = output.replace(nomangleRegex, '');
    }
    // Process @define directives
    const defineRegex = /@define\s+(\S+)\s+(.*)/;
    while (true) {
      // Find the next @define directive
      const match = defineRegex.exec(output);
      if (!match) {
        break;
      }
      const defineMacro = match[1];
      const replaceValue = match[2];
      // Remove the @define line
      output = output.replace(defineRegex, '');
      // Replace all instances of the macro with its value
      //
      // BUGBUG: We start at the beginning of the file, which means we could do replacements prior to the @define
      //   directive. This is unlikely to happen in real code but will cause some weird behaviors if it does.
      let offset = output.indexOf(defineMacro);
      while (offset >= 0 && offset < output.length) {
        // Ensure that the macro isn't appearing within a larger token
        let nextOffset = offset + defineMacro.length;
        let nextChar = output[nextOffset];
        if (/\w/.test(nextChar)) {
          // Ignore. Part of a larger token. Begin searching again at the next non-word.
          do {
            nextChar = output[++nextOffset];
          } while (nextChar && /\w/.test(nextChar));
          offset = nextOffset;
        }
        else {
          // Replace
          const begin = output.substring(0, offset);
          const end = output.substring(nextOffset);
          output = begin + replaceValue + end;
          offset += replaceValue.length;
        }
        // Advance the offset
        offset = output.indexOf(defineMacro, offset);
      }
    }
    // Process @const directives
    const constRegex = /@const\s+(.*)/;
    while (true) {
      // Find the next @const directive
      const match = constRegex.exec(output);
      if (!match) {
        break;
      }
      // Parse the tokens
      const parts = match[1].split(/\s/);
      if (parts.length !== 2) {
        throw new Error('@const directives require two parameters');
      }
      const constType = parts[0];
      const constName = parts[1];
      // Assign a substitution value
      const substitutionValue = this.assignSubstitionValue(constName, constType);
      // Replace the directive with a constant declaration. Note that `String.replace()` has special treatment of $ in
      // the replacement string parameter, so we provide a lambda to the replacement string to disable that.
      const newCode = `const ${constType} ${constName}=${substitutionValue};`;
      output = output.replace(constRegex, () => newCode);
    }
    return output;
  }
  /** Determines the token type of a token string */
  static getTokenType(token) {
    if (token === 'attribute') {
      return TokenType.ttAttribute;
    }
    else if (token === 'uniform') {
      return TokenType.ttUniform;
    }
    else if (token === 'varying') {
      return TokenType.ttVarying;
    }
    else if (glslTypes.indexOf(token) > -1) {
      return TokenType.ttType;
    }
    else if (glslReservedKeywords.indexOf(token) > -1) {
      return TokenType.ttReservedToken;
    }
    else if (token === ';') {
      return TokenType.ttSemicolon;
    }
    else if (token === '.') {
      return TokenType.ttDot;
    }
    else if (token === '[' || token === ']') {
      return TokenType.ttBracket;
    }
    else if (token[0] === '#') {
      return TokenType.ttPreprocessor;
    }
    else if (/[0-9]/.test(token[0])) {
      return TokenType.ttNumeric;
    }
    else if (/\w/.test(token[0])) {
      return TokenType.ttToken;
    }
    else {
      return TokenType.ttOperator;
    }
  }
  /**
   * The final pass consists of the actual minifier itself
   */
  minifier(content) {
    // Unlike the previous passes, on this one, we start with an empty output and build it up
    let output = '';
    // The token regex looks for any of four items:
    //  1) An alphanumeric token (\w+), which may include underscores (or $ for substitution values)
    //  2) An operators (non-alphanumeric, non-dot). May consist of 2 characters if it ends in an =, e.g. <=, +=, or ==.
    //  3) A dot operator
    //  4) GLSL preprocessor directive beginning with #
    const tokenRegex = /[\w$]+|[^\s\w#.]=?|\.|#.*/g;
    //
    // Minifying uses a simple state machine which tracks the following four state variables:
    //
    /** Set when the state machine is within a uniform, attribute, or varying declaration */
    let declarationType = TokenType.ttNone;
    /** The last seen variable type (one of the glslTypes string values) */
    let variableType;
    /** Set when the previous token may require whitespace separating it from the next token */
    let mayRequireTrailingSpace = false;
    /** Token type of the immediately preceding token */
    let prevType = TokenType.ttNone;
    let match;
    while ((match = tokenRegex.exec(content))) {
      const token = match[0];
      const type = GlslMinify.getTokenType(token);
      /** Helper function to concatenate `token` to `output` */
      function writeToken(mayRequirePrecedingSpace, outputToken = token) {
        if (mayRequirePrecedingSpace && mayRequireTrailingSpace) {
          output += ' ';
        }
        output += outputToken;
      }
      switch (type) {
        case TokenType.ttPreprocessor: {
          // Preprocessor directives must always begin on a new line
          if (output !== '' && !output.endsWith('\n')) {
            output += '\n';
          }
          // Special case for #define: we want to minify the value being defined
          const defineRegex = /#define\s(\w+)\s(.*)/;
          const subMatch = defineRegex.exec(token);
          if (subMatch) {
            if (this.options.preserveDefines) {
              this.tokens.reserveKeywords([subMatch[1]]);
            }
            const minToken = this.tokens.minifyToken(subMatch[1]);
            output += '#define ' + minToken + ' ' + subMatch[2] + '\n';
            break;
          }
          // Preprocessor directives are special in that they require the newline
          output += token + '\n';
          // They also end any variable declaration
          declarationType = TokenType.ttNone;
          variableType = undefined;
          mayRequireTrailingSpace = false;
          break;
        }
        case TokenType.ttNumeric: {
          // Special case for numerics: we can omit a zero following a dot (e.g. "1." is the same as "1.0") in GLSL
          if (token === '0' && prevType === TokenType.ttDot) {
            break;
          }
          writeToken(true);
          mayRequireTrailingSpace = true;
          break;
        }
        case TokenType.ttSemicolon: {
          writeToken(false);
          // A semicolon ends a variable declaration
          declarationType = TokenType.ttNone;
          variableType = undefined;
          mayRequireTrailingSpace = false;
          break;
        }
        case TokenType.ttOperator:
        case TokenType.ttBracket:
        case TokenType.ttDot: {
          writeToken(false);
          mayRequireTrailingSpace = false;
          break;
        }
        case TokenType.ttAttribute:
        case TokenType.ttUniform:
        case TokenType.ttVarying: {
          writeToken(true);
          declarationType = type;
          mayRequireTrailingSpace = true;
          break;
        }
        case TokenType.ttType: {
          writeToken(true);
          variableType = token;
          mayRequireTrailingSpace = true;
          break;
        }
        case TokenType.ttReservedToken: {
          writeToken(true);
          mayRequireTrailingSpace = true;
          break;
        }
        case TokenType.ttToken: {
          // Special case: a token following a dot is a swizzle mask. Leave it as-is.
          if (prevType === TokenType.ttDot) {
            writeToken(false);
            mayRequireTrailingSpace = true;
            break;
          }
          // Another special case: if the token follows a bracket, it is an array size not a variable/uniform
          // declaration, e.g. `uniform vec3 u[ARRAY_SIZE]`.
          let realDeclarationType = declarationType;
          if (prevType === TokenType.ttBracket) {
            realDeclarationType = TokenType.ttNone;
          }
          switch (realDeclarationType) {
            case TokenType.ttAttribute:
            case TokenType.ttVarying:
              // For attribute and varying declarations, turn off minification.
              this.tokens.reserveKeywords([token]);
              writeToken(true);
              break;
            case TokenType.ttUniform:
              if (this.options.preserveUniforms) {
                this.tokens.reserveKeywords([token]);
              }
              writeToken(true, this.tokens.minifyToken(token, variableType));
              break;
            default:
              if (this.options.preserveVariables) {
                this.tokens.reserveKeywords([token]);
              }
              writeToken(true, this.tokens.minifyToken(token));
              break;
          }
          mayRequireTrailingSpace = true;
          break;
        }
      }
      // Advance to the next token
      prevType = type;
    }
    return output;
  }
  executeAndStringify(content) {
    const input = { contents: content };
    return this.executeFileAndStringify(input);
  }
  executeFileAndStringify(input) {
    return __awaiter(this, void 0, void 0, function* () {
      const program = yield this.executeFile(input);
      const esModule = this.options.esModule;
      switch (this.options.output) {
        case 'sourceOnly':
          return program.sourceCode;
        case 'source':
          return `${esModule ? 'export default' : 'module.exports ='} ${GlslMinify.stringify(program.sourceCode)}`;
        case 'object':
        default:
          return `${esModule ? 'export default' : 'module.exports ='} ${GlslMinify.stringify(program)}`;
      }
    });
  }
  /** Similar to JSON.stringify(), except without double-quotes around property names */
  static stringify(obj) {
    if (Array.isArray(obj)) {
      let output = '[';
      let isFirst = true;
      for (const value of obj) {
        if (!isFirst) {
          output += ',';
        }
        output += this.stringify(value);
        isFirst = false;
      }
      output += ']';
      return output;
    }
    else if (typeof (obj) === 'object') {
      let output = '{';
      let isFirst = true;
      for (const prop in obj) {
        const value = obj[prop];
        if (!isFirst) {
          output += ',';
        }
        output += prop + ':' + this.stringify(value);
        isFirst = false;
      }
      output += '}';
      return output;
    }
    else {
      return JSON.stringify(obj);
    }
  }
}

export default GlslMinify;
