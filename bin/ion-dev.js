// Ionic Dev Server: Dev Logger


var IonicDevServer = {
  start: function() {
    console.log('dev server enabled');

    this.bindKeyboardEvents();
  },

  handleError: function(err) {
    var self = this;

    console.log('HANDLE ERROR', err);

    var existing = document.querySelector('._ionic-error-view');
    if(existing) {
      document.body.removeChild(existing);
    }

    this._errorWindow = this._makeErrorWindow(err);
    document.body.appendChild(this._errorWindow);

    window.requestAnimationFrame(function() {
      self._errorWindow.classList.add('show');
    });

  },

  _makeErrorWindow: function(err) {
    var d = document.createElement('div');
    d.className = '_ionic-error-view';

    d.innerHTML = '<div style="position: relative"><div class="_ionic-error-navbar"><h1 class="_title">Runtime Error</h1><div class="_ionic-error-close">Close</div></div><div class="_ionic-error-content"><div class="message">' + err.message + '</div><h4>Stacktrace</h4><div class="stack">' + err.stack + '</div>' + this._makeErrorButtonsHtml() + '</div></div>';

    d.querySelector('._ionic-error-close').addEventListener('click', function(e) {
      window.requestAnimationFrame(function() {
        d.classList.remove('show');
        setTimeout(function() {
          document.body.removeChild(d);
        }, 500);
      });
    });

    return d;
  },
  _makeErrorButtonsHtml: function() {
    var d = document.createElement('div');
    d.className = '_ion-error-buttons';

    var b1 = document.createElement('button');
    b1.innerHTML = 'Close (ESC)';
    b1.className = '_button';

    var b2 = document.createElement('button');
    b2.innerHTML = 'Reload (&#8984;)';
    b2.className = '_button';

    //d.appendChild(b1);
    //d.appendChild(b2);

    return d.innerHTML;
  },
  reloadApp: function() {
    console.log('RELOAD');

    if(window.cordova) {
      window.location.reload(true);
    }
  },
  showDebugMenu: function() {
    if(window.IonicDevtools) {
      window.IonicDevtools.showDebugMenu();
    }
  },
  bindKeyboardEvents: function() {
    var self = this;

    document.addEventListener('keydown', function(event) {
      var key = event.keyCode || event.charCode || 0;

      // Check for reload command (cmd/ctrl+R)
      if(key == 82 && (event.metaKey || event.ctrlKey)) {
        self.reloadApp();
      }

      // Check for debugger command (cmd/ctrl+D)
      if(key == 68 && (event.metaKey || event.ctrlKey)) {
        self.showDebugMenu();
      }
    });
  }
};

IonicDevServer.start();
