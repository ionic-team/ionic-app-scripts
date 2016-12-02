var $ = document.querySelector.bind(document);

var API_ROOT = '/ionic-lab/api/v1';

// Bind the dropdown platform toggles
function bindToggles() {
  // Watch for changes on the checkboxes in the device dropdown
  var iphone = $('#device-iphone');
  var android = $('#device-android');
  var windows = $('#device-windows');

  var devices = [iphone, android, windows];
  for(i in devices) {
    devices[i].addEventListener('change', function(e) {
      var device = this.name;
      console.log('Device changed', device, this.checked);

      showDevice(device, this.checked);
    })
  }
}

// Show one of the devices
function showDevice(device, isShowing) {
  $('#' + device).style.display = isShowing ? '' : 'none';
}

function setCordovaInfo(data) {
  let el = $('#app-info');
  el.innerHTML = data.name + ' - v' + data.version;
  if(data.name) {
    document.title = data.name + ' - Ionic Lab';
  }
}

function loadCordova() {
  var req = new XMLHttpRequest();
  req.addEventListener('load', function(e) {
    setCordovaInfo(JSON.parse(req.response));
  })
  req.open('GET', API_ROOT + '/cordova', true)
  req.send(null);
}

loadCordova();
bindToggles();
