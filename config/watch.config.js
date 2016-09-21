var buildUpdate = require('../dist/build').buildUpdate;
var copyUpdate = require('../dist/copy').copyUpdate;
var sassUpdate = require('../dist/sass').sassUpdate;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.html',
        '{{TMP}}/**/*.js'
      ],
      options: { ignored: /(index.html$)/ },
      callback: buildUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.scss'
      ],
      callback: sassUpdate
    },

    {
      paths: [
        '{{SRC}}/assets'
      ],
      callback: copyUpdate
    },

  ]

};
