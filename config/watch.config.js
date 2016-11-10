var fullBuildUpdate = require('../src/build').fullBuildUpdate;
var buildUpdate = require('../src/build').buildUpdate;
var templateUpdate = require('../src/template').templateUpdate;
var copyUpdate = require('../src/copy').copyUpdate;
var sassUpdate = require('../src/sass').sassUpdate;
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
