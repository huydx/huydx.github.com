function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

function MachineGun(context) {
    var ctx = this;
    var loader = new BufferLoader(context, ['m4a1.mp3', 'm1-garand.mp3'], onLoaded);

    function onLoaded(buffers) {
      ctx.buffers = buffers;
      ctx.shootRound(1, 100, 0.2);
    };
    loader.load();
}

MachineGun.prototype.shootRound = function (type, rounds, interval, random, random2) {
    if (typeof random == 'undefined') {
        random = 0;
    }
    var time = context.currentTime;
    for (var i = 0; i < rounds; i++) {
        var source = this.makeSource(this.buffers[type]);
        source.playbackRate.value = 1 + Math.random() * random2;
        source.noteOn(time + i * interval + Math.random() * random);
    }
}

MachineGun.prototype.makeSource = function (buffer) {
    var source = context.createBufferSource();
    var compressor = context.createDynamicsCompressor();
    var gain = context.createGainNode();
    gain.gain.value = 0.2;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(context.destination);
    return source;
};

function load() {
  var gun = new MachineGun(context);
}
var context = new webkitAudioContext();  
load();
