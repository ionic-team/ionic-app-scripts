// Ionic Dev Server: Client Side Logger

window.IonicDevServer = {

  start: function() {
    IonicDevServer.msgQueue = [];

    IonicDevServer.consoleLog = console.log;
    IonicDevServer.consoleError = console.error;

    if (IonicDevServerConfig.sendConsoleLogs) {
      IonicDevServer.patchConsole();
    }

    IonicDevServer.openConnection();

  },

  openConnection: function() {
    IonicDevServer.socket = new WebSocket('ws://' + window.location.hostname + ':' + IonicDevServerConfig.wsPort);

    IonicDevServer.socket.onopen = function(ev) {
      IonicDevServer.socketReady = true;

      IonicDevServer.socket.onmessage = function(ev) {
        try {
          var msg = JSON.parse(ev.data);
          switch (msg.category) {
            case 'taskEvent':
              IonicDevServer.receiveTaskEvent(msg);
              break;
          }
        } catch (e) {
          IonicDevServer.consoleError('error receiving ws message', e);
        }
      };

      IonicDevServer.socket.onclose = () => {
        IonicDevServer.consoleLog('Dev server logger closed');
      };

      IonicDevServer.drainMessageQueue();
    };
  },

  queueMessageSend: function(msg) {
    IonicDevServer.msgQueue.push(msg);
    IonicDevServer.drainMessageQueue();
  },

  drainMessageQueue: function() {
    if (IonicDevServer.socketReady) {
      var msg;
      while (msg = IonicDevServer.msgQueue.shift()) {
        try {
          IonicDevServer.socket.send(JSON.stringify(msg));
        } catch (e) {
          IonicDevServer.consoleError('ws error: ' + e);
        }
      }
    }
  },

  patchConsole: function() {
    function patchConsole(consoleType) {
      console[consoleType] = (function() {
        var orgConsole = console[consoleType];
        return function() {
          orgConsole.apply(console, arguments);
          var msg = {
            category: 'console',
            type: consoleType,
            data: []
          };
          for (var i = 0; i < arguments.length; i++) {
            msg.data.push(arguments[i]);
          }
          if (msg.data.length) {
            IonicDevServer.queueMessageSend(msg);
          }
        };
      })();
    }

    for (var consoleType in console) {
      if (console.hasOwnProperty(consoleType) && typeof console[consoleType] === 'function') {
        patchConsole(consoleType);
      }
    }
  },

  receiveTaskEvent: function(taskEvent) {
    if (taskEvent.data && ['bundle', 'sass', 'transpile', 'template'].indexOf(taskEvent.data.scope) > -1) {
      IonicDevServer.consoleLog(taskEvent.data.msg);
    }
  }

};

IonicDevServer.start();
