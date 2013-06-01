(function(){
  window.onload = init;
  window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame || 
      window.oRequestAnimationFrame || 
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
  
  function animate() {
    var canvas = document.getElementById('ground');
    var context = canvas.getContext('2d');

    // update

    // clear
    //context.clearRect(0, 0, canvas.width, canvas.height);

    // draw stuff

    // request new frame
    requestAnimFrame(function() {
      animate();
    });
  }

  function init() {
    animate();
    var AUDIO_FILE = "emily.mp3",
      waveform = document.getElementById("wave"),
      ground = document.getElementById("ground"),
      ctx = waveform.getContext("2d"),
      ctx2 = ground.getContext("2d"),
      dancer;
    dancer  = new Dancer();
    
    kick = dancer.createKick({
      onKick: function(){
        ctx.strokeStyle = '#ff0077';
        ctx2.strokeStyle = '#ff0077';
        randomDraw(ground);
      },

      offKick: function(){
        ctx.strokeStyle = '#ffffff';
      },

      threshold: 0.15
    }).on(); 

    // Using an audio object
    dancer
      .load({ src: AUDIO_FILE })
      .waveform(waveform, {strokeType: '#ffffff', strokeWidth: 2});
      
    Dancer.isSupported() || loaded();
    !dancer.isLoaded() ? dancer.bind( 'loaded', loaded ) : loaded();
    dancer.play();
    /*
     ** Loading
     **/

   function loaded () {
     var
       loading = document.getElementById('loading'),
       anchor  = document.createElement('A'),
       supported = Dancer.isSupported(),
       p;
     anchor.appendChild( document.createTextNode( supported ? 'Play!' : 'Close' ));
     anchor.setAttribute('href', '#');
     loading.innerHTML = '';
     loading.appendChild( anchor );

     if ( !supported ) {
       p = document.createElement('P');
       p.appendChild( document.createTextNode( 'Your browser does not currently support either Web Audio API or Audio Data API. The audio may play, but the visualizers will not move to the music; check out the latest Chrome or Firefox browsers!' ) );
       loading.appendChild( p );
     }
     anchor.addEventListener( 'click', function () {
       document.getElementById('loading').style.display = 'none';
     });
    }
    
    function circleDraw(x, y, r, ctx) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2, true); 
      ctx.closePath();
      ctx.fill();  
    }
    
    function randomDraw(canvas) {     
      var w = canvas.width;
      var h = canvas.height; 
      ctx = canvas.getContext("2d");
      
      x = Math.floor((Math.random()*h)+1); 
      y = Math.floor((Math.random()*w)+1); 

      r = Math.floor((Math.random()*Math.min(w,h)/2)+1); 
      ctx.clearRect( 0, 0, w, h );
      circleDraw(x, y, r, ctx);
    }
    // For debugging
    window.dancer = dancer;
  }
}());
