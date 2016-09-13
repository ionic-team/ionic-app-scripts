
// https://www.npmjs.com/package/fs-extra

module.exports = {
  include: [
    {
      src: 'src/assets',
      dest: 'www/assets'
    },
    {
      src: 'src/index.html',
      dest: 'www/index.html'
    },
    {
      src: 'node_modules/ionic-angular/polyfills/polyfills.js',
      dest: 'www/build/polyfills.js'
    },
  ]
};
