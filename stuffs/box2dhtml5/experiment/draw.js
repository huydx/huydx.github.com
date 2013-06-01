(function(global) {

    // Base Setup
    // -----------------
    var G = global.G = {};

    // Graphics
    // ------------------
    var Graphics = G.Graphics = function ( surfaceId, style ) {
        this.canvas = document.getElementById( surfaceId );
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.getContext( "2d" );
        this.style = style || {};
    };

    Graphics.prototype = {
        clear: function() {
            this.context.clearRect( 0, 0, this.width, this.height );
        },
        // Return the context given
        getContext: function() {
            return this.context;
        },
        // Set drawing options
        // options can include fillStyle, strokeWidth
        // arguments: options [Object]
        setStyle: function( style ) {
            this.style = style;
        },
        // Draw a rectangle
        drawRect: function( x, y, width, height ) {
        },
        // Draw a Circle
        drawCircle: function( x, y, radius ) {
            var ctx = this.getContext();
            ctx.save();
            // Set style
            ctx.fillStyle = this.style.fillStyle ? this.style.fillStyle : "";
            ctx.strokeWidth = this.style.strokeWidth ? this.style.strokeWidth : ""; 
            // Draw
            ctx.beginPath();
            ctx.moveTo( x, y );
            ctx.arc( x, y, radius, Math.PI * 2, false );
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        },
    };

    // Entity
    // -----------------
    var Entity = G.Entity = function ( attributes, graphics ) {
        this.defaultAttrs = {
            x: 0,
            y: 0,
            type: "Entity",
            style: {
                fillStyle: undefined,
                strokeWidth: undefined
            }
        };
        this.setDefaultAttrs( this.defaultAttrs );
        this.setAttrs( attributes );
        this.g = graphics;
    };
    Entity.prototype = {
        setDefaultAttrs: function ( attrs ) {
            if ( attrs ) {
                for ( var key in attrs ) {
                    if ( this.key === undefined ) {
                        this.key = attrs[ key ];
                    }
                }
            }
        },
        setAttrs: function ( attrs ) {
            for ( var key in attrs ) {
                this._setAttr( this, key, attrs[ key ] );
            }
        },
        getAttrs: function( keys ) {
            var result = {};
            for ( var k in keys ) {
                if ( this[ keys[ k ] ] !== undefined ) {
                    result[ k ] = this[ keys[ k ] ];
                }
            }
            return result;
        },
        _setAttr: function ( obj, attr, val ) {
            if ( val !== undefined ) {
                obj[ attr ] = val;
            }
        },
        
     };

    // Circle Object
    // -----------------
    var Circle = G.Circle = function ( attributes, graphics ) {
        this.defaultAttrs = {
            x: 0,
            y: 0,
            radius: 0,
            type: "Circle",
        };
        attributes.draw = function () {
            this.g.setStyle ( this.style );
            this.g.drawCircle( this.x, this.y, this.radius );
        };
        // extend prototype
        _.extend ( Circle.prototype, Entity.prototype );
        // populate common properties
        Entity.apply(this, [ attributes, graphics ]);
    };    
        
    // Scene
    // -----------------
    G.Scene = {
        id: 0,
        entities: {},
        g: undefined,
        // init function. Override for specific purpose
        init: function() {
        },
        update: function() {
            for ( var i in this.entities ) {
                this.entities[i].update();
            }
        },
        render: function() {
            this.g.clear();
            for ( var i in this.entities ) {
                this.entities[i].draw();
            }
        },
        addEntity: function( entity ) {
            entity.id = this.id++;
            this.entities[ entity.id ] = entity;
        },
        removeEntity: function( entity ) {
            delete this.entities[ entity.id ];
        }
    };  
    // Global Loop function
    // -----------------
    G.run = function ( scene ) {
        // User define init
        scene.init();

        // get last time. Use for calculating fps
        scene.time = (new Date()).getTime();
        scene.timeDiff = 0;

        // Main loop
        function loop() {
            // scene.handleEvent();
            // TODO(Tal): Event processing module for G
            
            // Update the scene
            scene.update();

            // render the scene
            scene.render();

            // Calculate current time and timeDiff
            var now = (new Date()).getTime();
            scene.timeDiff = now - scene.time;
            scene.time = now;
            
            // Request the new loop
            requestAnimFrame(function() {
                loop();
            });
        };
        // trigger the world 
        loop();
    };
})(this);

window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame     ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
} )();

// Request Animation Frame. The prefered FPS is 60
window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();


window.onload = function() {
    var scene = _.extend( {}, G.Scene );
    var g = new G.Graphics("container");
    // 
    scene.init = function() {
        // Base Setup
        // -------------
        this.g = g;
        // World plane
        this.planes = [
            Vector.create( [ 1, 0, 10 ] ),
            Vector.create( [ 0, -1, 480 ] ),
            Vector.create( [ -1, 0, 640 ] ),
            Vector.create( [ 0, 1, 10 ] )
        ];
        // world gravity
        this.gravity = Vector.create( [ 0, 10 ] );
       
        // Character Setup
        // -------------
        // Create an entity
        var circle = new G.Circle( {
            x: Math.floor(Math.random()*400),
            y: Math.floor(Math.random()*100),
            radius: 10,
            // velocity vector. Using sylvester library
            velocity: Vector.create( [ 0,
                                       Math.floor(Math.random()*10) ] ),
            // restitution between 0 and 1.
            // restitution equals 1. This means the ball fully restore its power
            resitution: 0.7,
            // mass property
            mass: 10,
            // color
            style: {
                fillStyle: '#'+Math.floor(Math.random()*16777215).toString(16) 
            },
        }, this.g );

        // Update function for character
        circle.update = function() {
            var i, distance, tmp, 
                len = scene.planes.length;
            
            // check for collision
            for ( i = 0; i < len; ++i ) {
                // Get direction vector
                var N = $V( [ scene.planes[i].e(1), scene.planes[i].e(2) ] );
                // Calculate the distance
                distance = $V( [ this.x, this.y, 1 ] ).dot( scene.planes[i] );
                tmp = this.velocity.dot( N );
                // border collision examination
                if ( distance < 0 && tmp < 0 ) {
                    this.velocity = this.velocity.subtract ( N.multiply( (1 + this.resitution) * tmp * (1 / this.mass) ) );
                }
            }
            // Add gravity
            this.velocity = this.velocity.add( scene.gravity.x( scene.timeDiff / 1000 ) );
            
            // Update
            this.x += this.velocity.e(1);
            this.y += this.velocity.e(2);
        };
        
        // Add the entity to the scene
        this.addEntity( circle );
    };

    // Start animation
    G.run( scene );
};
