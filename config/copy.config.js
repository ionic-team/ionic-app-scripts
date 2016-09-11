
/**
 * Possible path variable:
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
