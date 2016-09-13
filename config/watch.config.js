var copy = require('../dist/copy').copy;
var rebuild = require('../dist/build').rebuild;
var sass = require('../dist/sass').sass;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.html',
        '{{SRC}}/**/*.ts'
      ],
      options: { ignored: /([\/\\]\.)|(index.html$)/ },
      callback: function(event, path, context) {
        rebuild(context);
      }
    },

    {
      paths: '{{SRC}}/**/*.scss',
      options: { ignored: /[\/\\]\./ },
      callback: function(event, path, context) {
        sass(context);
      }
    },

    {
      paths: [
        '{{SRC}}/assets/*',
        '{{SRC}}/index.html'
      ],
      options: { ignored: /[\/\\]\./ },
      callback: function(event, path, context) {
        copy(context);
      }
    },

  ]

};
