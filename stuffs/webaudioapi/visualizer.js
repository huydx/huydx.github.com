(function(){
  window.onload = init;

  function init() {
    var context = new webkitAudioContext();
    var audiobuffer;
    var sourceNode;
    var analyzer;
    window.javascriptnode = null;

    var ctx = document.getElementById("ground").getContext("2d");  
    var gradient = ctx.createLinearGradient(0,0,0,130);

    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');  

    setupAudioNodes();
    loadsound("emily.mp3");
  
    function setupAudioNodes() {
      window.javascriptnode = context.createJavaScriptNode(2048, 1, 1);
      window.javascriptnode.connect(context.destination);
      analyzer = context.createAnalyser();
      analyzer.smoothingTimeConstant = 0.3;
      analyzer.fftSize = 1024;
 
      sourceNode = context.createBufferSource();
      splitter = context.createChannelSplitter();
      
      splitter.connect(analyzer, 0, 0);
      sourceNode.connect(splitter);
      analyzer.connect(window.javascriptnode);
      sourceNode.connect(context.destination);
    }

    function loadsound(source) {
      var req = new XMLHttpRequest();
      req.open('GET', source, true);
      req.responseType = 'arraybuffer';

      req.onload = function() {
        context.decodeAudioData(req.response, function(buffer){
          playSound(buffer);
        }, onError);
      }
      req.send();
    }

    function playSound(buffer){
      sourceNode.buffer = buffer;
      sourceNode.noteOn(0);
    }

    var onError = function(e) {
      console.log(e);

    }

    function getAverageVolume(array) {
      var vals = 0;
      var length = array.length;  

      for (var i=0; i<length; i++) {
        vals += array[i];
      }

      return (vals / length)
    }
   
    window.javascriptnode.onaudioprocess = function() {
      var array = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(array);
      var average = getAverageVolume(array);

      ctx.clearRect(0, 0, 60, 130);
      ctx.fillStyle=gradient;
      ctx.fillRect(0,130-average,25,130);
    }
  }
})();
