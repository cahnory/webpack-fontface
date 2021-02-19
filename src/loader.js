module.exports = async function loader(content) {
  const { getFontModuleContent } = this.getOptions();
  this.async()(null, await getFontModuleContent(content));
};

module.exports.raw = true;
