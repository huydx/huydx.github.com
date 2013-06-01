(function() {
  var context, soundSource, soundBuffer, url = 'emily.mp3';

  function init() {
    if (typeof AudioContext !== "undefined") {
        context = new AudioContext();
    } else if (typeof webkitAudioContext !== "undefined") {
      context = new webkitAudioContext();
    } else {
      throw new Error('AudioContext not supported. :(');
    }
  }
  
  function startSound() {
    // Note: this loads asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      var audioData = request.response;
      audioGraph(audioData);
    };
    request.send();
  }
  // Finally: tell the source when to start
  
  function playSound() {
  // play the source now
    soundSource.noteOn(context.currentTime);
  }
  
  function stopSound() {
  // stop the source now
    soundSource.noteOff(context.currentTime);
  }
  
  // Events for the play/stop bottons
  // This is the code we are interested in
  function audioGraph(audioData) {
    var convolver;
  
    soundSource = context.createBufferSource();
    soundBuffer = context.createBuffer(audioData, true);
    soundSource.buffer = soundBuffer;
    // Again, the context handles the difficult bits
    convolver = context.createConvolver();
    // Wiring
    soundSource.connect(convolver);
    convolver.connect(context.destination);
    // Loading the 'Sound Snapshot' to apply to our audio
    setReverbImpulseResponse('echo.mp3', convolver, function() {playSound()});
  }
  
  function setReverbImpulseResponse(url, convolver, callback) {
    // As with the main sound source, 
    // the Impulse Response loads asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      convolver.buffer = context.createBuffer(request.response, false);
      callback();
    }
    request.send();
  }
  init();
  // Impulse Response from Fokke van Saane 
  // http://fokkie.home.xs4all.nl/IR.htm
  startSound();
}())
