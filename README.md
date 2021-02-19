<div align="center">
  <img width="200" height="200" src="https://cdn.worldvectorlogo.com/logos/javascript.svg">
  <a href="https://webpack.js.org/">
    <img width="200" height="200" vspace="" hspace="25" src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon-square-big.svg">
  </a>
  <h1>webpack-fontface</h1>
</div>

This plugin generates a css @font-face rule and the alternatives font formats when importing a font file in ttf format.

- [x] generate *eot* font
- [x] generate *svg* font
- [x] generate *woff* font
- [x] generate *woff2* font
- [x] extract font family, style and weight from font file
- [x] generate *@font-face* css rule
- [x] support *@font-face* local src
- [x] support *@font-face* descriptors
- [x] returns font family, style and weight to the js

## Install

Using npm:

```sh
npm install webpack-fontface --save-dev
```

## Usage

Add the plugin to your webpack config file:

```js
const WebpackFontfacePlugin = require('webpack-fontface');
const options = { ... };

module.exports = {
  ...
  plugins: [
    new WebpackFontfacePlugin(options)
  ]
};
```

And import a font from your app:

```js
const { fontFamily, fontStyle, fontWeight } from './Roboto-LightItalic.ttf';

console.log(fontFamily); // "Roboto"
console.log(fontStyle);  // "italic"
console.log(fontWeight); // 300
```

By default all files with a *.ttf* extension will be processed.

### Options

#### `virtualPath`

Type: `String`  
Default: `'__GENERATED_WEBPACK_FONTFACE__'`

The path where are written the generated css and font files. The path could be absolute or relative to the compiler context.  
Even if the files are written to memory, you must ensure that their path does not collide with existing files.

#### `rules`

Type: `Array`  
Default: `[DefaultRule]`

List of rules for *@font-face* generation. When a module is imported, the first rule with a successful test is used to process it. If no rule test is successful, the module is ignored.

The *DefaultRule* takes this shape:

```js
{
  test: /\.ttf$/,
  useEot: true,
  useSvg: true,
  useTtf: true,
  useWoff: true,
  useWoff2: true,
  descriptors: {},
  locals: [],
}
```

#### `rules[*].test`

Type: `RegExp`  
Default: `/\.ttf$/`

Used to check from its path whether an imported module is a font to process.

#### `rules[*].useEot`

Type: `Boolean`  
Default: `true`

If *eot* font should be generated and used as a source by the *@font-face*.

#### `rules[*].useSvg`

Type: `Boolean`  
Default: `true`

If *svg* font should be generated and used as a source by the *@font-face*.

#### `rules[*].useTtf`

Type: `Boolean`  
Default: `true`

If *ttf* font should be generated and used as a source by the *@font-face*.

#### `rules[*].useWoff`

Type: `Boolean`  
Default: `true`

If *woff* font should be generated and used as a source by the *@font-face*.

#### `rules[*].useWoff2`

Type: `Boolean`  
Default: `true`

If *woff2* font should be generated and used as a source by the *@font-face*.

#### `rules[*].descriptors`

Type: `Object`  
Default: `{}`

An object containing *@font-face* descriptors with camelCase names. Eight descriptors are supported:
- fontDisplay
- fontFamily <sup>*</sup>
- fontStretch
- fontStyle <sup>*</sup>
- fontWeight <sup>*</sup>
- fontVariant
- fontFeatureSettings
- fontVariationSettings

<sup>*</sup> If not defined, these descriptors are extracted from the font file.

[More about descriptors](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face#descriptors)

#### `rules[*].locals`

Type: `Array`  
Default: `[]`

A list of font names to be used as local sources by the *@font-face*.

[More about local sources](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face#description)
