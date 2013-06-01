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
        Entity.apply(this, [ attributes, graphics ]);
    };    
        
    // Scene
    // -----------------
    G.Scene = {
        id: 0,
        entities: {},
        g: undefined,
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
        scene.init();
        function loop() {
            //scene.handleEvent();
            scene.update();
            scene.render();
            requestAnimFrame(function() {
                loop();
            });
        };
        // trigger the loop
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
    scene.init = function() {
        this.g = g;
        // World plane
        this.planes = [
            Vector.create( [ 1, 0, 0 ] ),
            Vector.create( [ 0, -1, 480 ] ),
            Vector.create( [ -1, 0, 640 ] ),
            Vector.create( [ 0, 1, 0 ] )
        ];
        // Create an entity
        for ( var j = 0; j < 10; j++ ) {
            var circle = new G.Circle( {
                x: Math.floor(Math.random()*100),
                y: Math.floor(Math.random()*100),
                radius: 10,
                velocity: Vector.create( [ Math.floor(Math.random()*10),Math.floor(Math.random()*10)]),    // velocity vector. Using sylvester library
                style: {
                    fillStyle: '#'+Math.floor(Math.random()*16777215).toString(16) 
                },
            }, this.g );

            circle.update = function() {
                var i, distance, tmp, 
                    len = scene.planes.length;
                // check for all planes
                for ( i = 0; i < len; ++i ) {
                    // Get direction vector
                    var N = $V( [ scene.planes[i].e(1), scene.planes[i].e(2) ] );
                    // Calculate the distance
                    distance = $V( [ this.x, this.y, 1 ] ).dot( scene.planes[i] );
                    tmp = this.velocity.dot( N );
                    // border collision examination
                    if ( distance < 0 && tmp < 0 ) {
                        this.velocity = this.velocity.subtract ( N.multiply( 2 * tmp ) );
                    }
                }
                this.x += this.velocity.e(1);
                this.y += this.velocity.e(2);
            };

            this.addEntity( circle );
        }
    };
    G.run( scene );
};
