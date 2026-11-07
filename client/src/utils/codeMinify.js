export async function minifyCode(code, language) {
  if (language === 'json') {
    const { parse, stringify } = await import('lossless-json');
    return stringify(parse(code));
  }
  if (language === 'js') {
    const { minify } = await import('terser');
    const result = await minify(code, { compress: false, mangle: false });
    return result.code;
  }
  if (language === 'css') {
    const { minify } = await import('csso');
    return minify(code, { restructure: false }).css;
  }
  if (language === 'html') {
    const { minify } = await import('html-minifier-terser/dist/htmlminifier.esm.bundle');
    // Preserve text/inline whitespace, pre/code, scripts and styles. Only safe syntactic cleanup.
    return minify(code, { removeComments: true, collapseWhitespace: false, minifyJS: false, minifyCSS: false });
  }
  throw new Error('Unsupported language.');
}
