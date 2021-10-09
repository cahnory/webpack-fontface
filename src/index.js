import path from 'path';
import { Template } from 'webpack';
import { validate } from 'schema-utils';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import ttf2svg from 'ttf2svg';
import ttf2eot from 'ttf2eot';
import ttfInfo from './ttfInfo';

import schema from './plugin-options.json';

const PLUGIN_NAME = 'webpack-fontface';
const DEFAULT_RULE = {
  test: /\.ttf$/,
  useEot: true,
  useSvg: true,
  useTtf: true,
  useWoff: true,
  useWoff2: true,
  descriptors: {},
  locals: [],
};
const SUB_FAMILY_WEIGHTS = [
  [/\bextra-light\b/, 200],
  [/\bultra-light\b/, 200],
  [/\bsemi-bold\b/, 600],
  [/\bdemi-bold\b/, 600],
  [/\bextra-bold\b/, 800],
  [/\bultra-bold\b/, 800],
  [/\bhairline\b/, 100],
  [/\bthin\b/, 100],
  [/\blight\b/, 300],
  [/\bnormal\b/, 400],
  [/\bmedium\b/, 500],
  [/\bbold\b/, 700],
  [/\bblack\b/, 900],
  [/\bheavy\b/, 900],
];

export default class WebpackFontface {
  constructor(options = {}) {
    validate(schema, options, {
      name: 'Webpack Fontface',
      baseDataPath: 'options',
    });
    this.virtualBasePath =
      options?.virtualPath || '__GENERATED_WEBPACK_FONTFACE__';
    this.rules = options.rules?.map(
      ({
        test,
        useEot,
        useSvg,
        useTtf,
        useWoff,
        useWoff2,
        descriptors,
        locals,
      }) => ({
        test: test || DEFAULT_RULE.test,
        useEot: Boolean(useEot ?? DEFAULT_RULE.useEot),
        useSvg: Boolean(useSvg ?? DEFAULT_RULE.useSvg),
        useTtf: Boolean(useTtf ?? DEFAULT_RULE.useTtf),
        useWoff: Boolean(useWoff ?? DEFAULT_RULE.useWoff),
        useWoff2: Boolean(useWoff2 ?? DEFAULT_RULE.useWoff2),
        descriptors: descriptors || DEFAULT_RULE.descriptors,
        locals: locals || [],
      }),
    ) || [DEFAULT_RULE];
  }

  apply(compiler) {
    const { rules, virtualBasePath } = this;
    const absoluteVirtualBasePath = path.resolve(
      compiler.context,
      virtualBasePath,
    );
    const virtualModules = new VirtualModulesPlugin({});
    virtualModules.apply(compiler);
    const resourceData = {};

    const getFontModuleContent = async (resource, content, rule) => {
      let shouldUpdate;
      const nextContent = content.toString('utf-8');
      const basename = path.basename(resource, path.extname(resource));
      const virtualPath = path.join(
        absoluteVirtualBasePath,
        path.relative(compiler.context, resource),
      );

      try {
        shouldUpdate =
          compiler.inputFileSystem.readFileSync(
            path.join(virtualPath, `${basename}.ttf`),
          ) !== nextContent;
      } catch (error) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        const info = await ttfInfo(content);
        const subFamily =
          (info.preferredSubFamily || info.fontSubFamily)
            ?.toLowerCase()
            .replace(/[^a-z]+/gi, '-') || '';
        const stylesheet = path.join(virtualPath, 'stylesheet.css');
        const fontFamily =
          rule.descriptors.fontFamily ||
          info.preferredFamily ||
          info.fontFamily;
        const fontStyle =
          rule.descriptors.fontStyle || subFamily.match(/\bitalic\b/)
            ? 'italic'
            : 'normal';
        const fontWeight =
          rule.descriptors.fontWeight ||
          SUB_FAMILY_WEIGHTS.find(([regex]) => subFamily.match(regex))?.[1] ||
          400;

        resourceData[resource] = Template.asString([
          `import "${stylesheet}";`,
          `export const fontFamily = ${JSON.stringify(fontFamily)};`,
          `export const fontStyle = ${JSON.stringify(fontStyle)};`,
          `export const fontWeight = ${JSON.stringify(fontWeight)};`,
          `export default ${JSON.stringify({
            fontFamily,
            fontStyle,
            fontWeight,
          })};`,
        ]);

        if (rule.useEot) {
          virtualModules.writeModule(
            path.join(virtualPath, `${basename}.eot`),
            ttf2eot(content).toString('utf8'),
          );
        }
        if (rule.useSvg) {
          virtualModules.writeModule(
            path.join(virtualPath, `${basename}.svg`),
            ttf2svg(content).toString('utf8'),
          );
        }
        if (rule.useTtf) {
          virtualModules.writeModule(
            path.join(virtualPath, `${basename}.ttf`),
            nextContent,
          );
        }
        if (rule.useWoff) {
          virtualModules.writeModule(
            path.join(virtualPath, `${basename}.woff`),
            ttf2woff(content).toString('utf8'),
          );
        }
        if (rule.useWoff2) {
          virtualModules.writeModule(
            path.join(virtualPath, `${basename}.woff2`),
            ttf2woff2(content).toString('utf8'),
          );
        }

        const descriptors = {
          ...rule.descriptors,
          fontFamily,
          fontStyle,
          fontWeight,
        };
        const locals = rule.locals.map((local) => local && `local(${local})`);

        virtualModules.writeModule(
          stylesheet,
          Template.asString([
            `@font-face {`,
            Template.indent(
              [
                ...Object.entries(descriptors).map(
                  ([name, value]) =>
                    value &&
                    `${name.replace(
                      /[A-Z]/g,
                      (up) => `-${up.toLowerCase()}`,
                    )}: ${value};`,
                ),
                rule.useEot && `src: url('./${basename}.eot');`,
                (locals.length ||
                  rule.useEot ||
                  rule.useWoff2 ||
                  rule.useWoff ||
                  rule.useTtf ||
                  rule.useSvg) &&
                  `src:`,
                Template.indent(
                  [
                    ...locals,
                    rule.useEot &&
                      `url('./${basename}.eot?#iefix') format('embedded-opentype')`,
                    rule.useWoff2 &&
                      `url('./${basename}.woff2') format('woff2')`,
                    rule.useWoff && `url('./${basename}.woff') format('woff')`,
                    rule.useTtf &&
                      `url('./${basename}.ttf') format('truetype')`,
                    rule.useSvg &&
                      `url('./${basename}.svg#${info.postscriptName}') format('svg')`,
                  ]
                    .filter(Boolean)
                    .map(
                      (row, index, block) =>
                        `${row}${index === block.length - 1 ? ';' : ','}`,
                    ),
                ),
              ].filter(Boolean),
            ),
            '}',
          ]),
        );
      }

      return resourceData[resource];
    };

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModule) => {
      normalModule.hooks.createModule.tapPromise(
        PLUGIN_NAME,
        async (module) => {
          if (
            path
              .relative(absoluteVirtualBasePath, module.resource)
              .indexOf('../') === 0
          ) {
            const rule = rules.find(({ test }) => module.resource.match(test));

            if (rule) {
              module.loaders.unshift({
                loader: path.resolve(__dirname, 'loader.js'),
                options: {
                  getFontModuleContent: (content) =>
                    getFontModuleContent(module.resource, content, rule),
                },
              });
              /* eslint-disable no-param-reassign */
              module.type = 'javascript/auto';
              module.generator = normalModule.getGenerator(module.type);
              module.parser = normalModule.getParser(module.type);
              /* eslint-enable no-param-reassign */
            }
          }
        },
      );
    });
  }
}
