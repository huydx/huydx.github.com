window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame   ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    window.oRequestAnimationFrame       ||
    window.msRequestAnimationFrame      ||
    function() {
      window.setTimeout(callback, 1000/60);
    }
})();

var context = new webkitAudioContext(), 
  ground = document.getElementById("ground"),
  dancer = new Dancer(),
  soundUrl = "testtone1.mp3",
  canvasCtx = ground.getContext("2d"),
  fps = 15,
  objsToDraw = [], //list objects
  audioBuffer,
  sourceNode;

//define functions
function draw() {
  canvasCtx.canvas.width = window.innerWidth;
  canvasCtx.canvas.height = window.innerHeight;

  var len = objsToDraw.length;
  for (var i = 0; i < len; i++) {
    //increment width of circle
    currentObj = objsToDraw[i];
    if (currentObj !== undefined) {
      x = currentObj.x;
      y = currentObj.y;
      r = currentObj.r;
      c = currentObj.color;    
      
      rgb = c.toString(16); 
      //draw
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, r, 0, 2 * Math.PI, false);
      canvasCtx.fillStyle = rgb + rgb + rgb;
      canvasCtx.fill();

      //increment width and color
      objsToDraw[i].color += 10;
      objsToDraw[i].r += 3;

      if (objsToDraw[i].color >= 255) {
        objsToDraw.splice(i,1) //if color is white then delete
      }
    }
  }
}

function init() {

}

//add new object to draw
function addNewObj(x,y) {
  obj = {
    x: x,
    y: y,
    r: 15, //circle width
    color: 0 //r==g==b==0
  }
  objsToDraw.push(obj);
}

//random obj add
function addRandomObj() {
  var canvasWidth = ground.width;
  var canvasHeight = ground.height;
  rand_x = Math.floor((Math.random() * canvasWidth))
  rand_y = Math.floor((Math.random() * canvasHeight))

  addNewObj(rand_x, rand_y)
}

//canvas click handle
ground.onclick = function(e) {
  // mouse coordinates relative 
  // to the canvas element
  var position = ground.getBoundingClientRect();
  var click = {
    x: e.clientX - position.left,
    y: e.clientY - position.top
  };

  addNewObj(click.x, click.y);
};


//init and run functions
function initAudio() {
  kick = dancer.createKick({
    onKick: function() {
      addRandomObj();
    },

    offKick: function() {
    
    },

    threshold: 0.3
  }).on();  

  dancer.load({src: soundUrl})
  dancer.play();
}

function animloop() {
  setTimeout(function() {
    requestAnimFrame(animloop);
    draw();
  }, 1000/fps);
};

animloop();
initAudio();
