
// https://www.npmjs.com/package/fs-extra

/**
 * Path variable templates can be used to dynamically
 * replace the paths. Possible path variable templates:
 * {{ROOT}}
 * {{SRC}}
 * {{TMP}}
 * {{WWW}}
 * {{BUILD}}
 */

module.exports = {
  include: [
    {
      src: '{{SRC}}/assets',
      dest: '{{WWW}}/assets'
    },
    {
      src: '{{SRC}}/index.html',
      dest: '{{WWW}}/index.html'
    },
  ]
};
