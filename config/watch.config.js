var fullBuildUpdate = require('../dist/build').fullBuildUpdate;
var buildUpdate = require('../dist/build').buildUpdate;
var templateUpdate = require('../dist/template').templateUpdate;
var copyUpdate = require('../dist/copy').copyUpdate;
var sassUpdate = require('../dist/sass').sassUpdate;
var copyConfig = require('./copy.config').include;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.ts'
      ],
      options: { ignored: '{{SRC}}/**/*.spec.ts' },
      eventName: 'all',
      callback: buildUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.html'
      ],
      eventName: 'all',
      callback: templateUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.scss'
      ],
      eventName: 'all',
      callback: sassUpdate
    },

    {
      paths: copyConfig.map(f => f.src),
      eventName: 'all',
      callback: copyUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*',
      ],
      options: {
        ignored: `{{SRC}}/assets/**/*`
      },
      eventName: 'unlinkDir',
      callback: fullBuildUpdate
    }

  ]

};
