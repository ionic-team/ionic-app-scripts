var buildUpdate = require('../dist/build').buildUpdate;
var copyUpdate = require('../dist/copy').copyUpdate;
var sassUpdate = require('../dist/sass').sassUpdate;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.html',
        '{{SRC}}/**/*.ts'
      ],
      options: { ignored: /([\/\\]\.)|(index.html$)/ },
      callback: buildUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.scss'
      ],
      options: { ignored: /[\/\\]\./ },
      callback: sassUpdate
    },

    {
      paths: [
        '{{SRC}}/assets'
      ],
      options: { ignored: /[\/\\]\./ },
      callback: copyUpdate
    },

  ]

};
