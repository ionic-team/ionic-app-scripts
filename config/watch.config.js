var buildUpdate = require('../dist/build').buildUpdate;
var templateUpdate = require('../dist/template').templateUpdate;
var copyUpdate = require('../dist/copy').copyUpdate;
var sassUpdate = require('../dist/sass').sassUpdate;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        'src/**/*.ts'
      ],
      callback: buildUpdate
    },

    {
      paths: [
        'src/**/*.html'
      ],
      options: { ignored: /(index.html$)/ },
      callback: templateUpdate
    },

    {
      paths: [
        'src/**/*.scss'
      ],
      callback: sassUpdate
    },

    {
      paths: [
        'src/assets'
      ],
      callback: copyUpdate
    },

  ]

};
