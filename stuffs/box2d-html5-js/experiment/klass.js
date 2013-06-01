(function() {

    // Base Setup
    // ----------------------
    var root = this;
    
    // Overall namespace
    var Game = root.Game = {};

    //global event
    var catchedEvent;

    var Class = Game.Class = function( Parent, props ) {
        var Child, ctor, i;

        // New constructor
        // ----------------------
        Child = function() {
            if ( Child.uber && Child.uber.hasOwnProperty( "initialize" ) ) {
                Child.uber.initialize.apply( this, arguments );
            }
            if ( Child.prototype.hasOwnProperty( "initialize" ) ) {
                Child.prototype.initialize.apply( this, arguments );
            }
        };
        // Inherit
        // ----------------------
        Parent = Parent || Object;
        ctor = function() {};
        ctor.prototype = Parent.prototype;
        Child.prototype = new ctor();
        Child.uber = Parent.prototype;
        Child.prototype.constructor = Child;

        // Add Implementation methods
        // ----------------------
        for ( i in props ) {
            if ( props.hasOwnProperty(i) ) {
                Child.prototype[i] = props[i];
            }
        }
        // return the class
        return Child;
    };

    // Helpers
    // ----------------------
    var Util = Game.Util = {
        addSetters: function( constructor, attrs ) {
            for ( var i in attrs ) {
                var attr = attrs[i];
                var method = 'set' + attr.charAt(0).toUpperCase() + attr.slice(1);
                constructor.prototype[ method ] = function( value ) {
                    console.log("called " + value);
                    this[ attr ] = value;
                };
            }
        },
        addGetters: function( constructor, attrs ) {
            for ( var i in attrs ) {
                var attr = attrs[i];
                var method = 'get' + attr.charAt(0).toUpperCase() + attr.slice(1);
                constructor.prototype[ method ] = function( value ) {
                    return this[ attr ];
                };
            }
        }
    };

    // Game.Event
    // ----------------------
    // Regular expression used to split event strings
    var eventSplitter = /\s+/;

    var Events = Game.Events = {
        // Bind one or more space separated events, `events`, to a `callback`
        // function. Passing `"all"` will bind the callback to all events fired.
        on: function(events, callback, context) {
            var calls, event, list;
            if (!callback) return this;

            events = events.split(eventSplitter);
            calls = this._callbacks || (this._callbacks = {});

            while (event = events.shift()) {
                list = calls[event] || (calls[event] = []);
                list.push(callback, context);
            }
            return this;
        },

        // Remove one or many callbacks. If `context` is null, removes all callbacks
        // with that function. If `callback` is null, removes all callbacks for the
        // event. If `events` is null, removes all bound callbacks for all events.
        off: function(events, callback, context) {
            var event, calls, list, i;

            // No events, or removing *all* events.
            if (!(calls = this._callbacks)) return this;
            if (!(events || callback || context)) {
                delete this._callbacks;
                return this;
            }

            events = events ? events.split(eventSplitter) : _.keys(calls);
            // Loop through the callback list, splicing where appropriate.
            while (event = events.shift()) {
                if (!(list = calls[event]) || !(callback || context)) {
                    delete calls[event];
                    continue;
                }

                for (i = list.length - 2; i >= 0; i -= 2) {
                    if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                        list.splice(i, 2);
                    }
                }
            }
            return this;
        },

        // Trigger one or many events, firing all bound callbacks. Callbacks are
        // passed the same arguments as `trigger` is, apart from the event name
        // (unless you're listening on `"all"`, which will cause your callback to
        // receive the true name of the event as the first argument).
        trigger: function(events) {
            var event, calls, list, i, length, args, all, rest;
            if (!(calls = this._callbacks)) return this;

            rest = [];
            events = events.split(eventSplitter);
            for (i = 1, length = arguments.length; i < length; i++) {
                rest[i - 1] = arguments[i];
            }

            // For each event, walk through the list of callbacks twice, first to
            // trigger the event, then to trigger any `"all"` callbacks.
            while (event = events.shift()) {
                // Copy callback lists to prevent modification.
                if (all = calls.all) all = all.slice();
                if (list = calls[event]) list = list.slice();

                // Execute event callbacks.
                if (list) {
                    for (i = 0, length = list.length; i < length; i += 2) {
                        list[i].apply(list[i + 1] || this, rest);
                    }
                }

                // Execute "all" callbacks.
                if (all) {
                    args = [event].concat(rest);
                    for (i = 0, length = all.length; i < length; i += 2) {
                        all[i].apply(all[i + 1] || this, args);
                    }
                }
            }
            return this;
        },
    };

    // Scene
    // ----------------------
    Game.Scene = {
        id: 0,
        entities: {},
        info: {
            ctx: undefined,
            width: 0,
            height: 0
        },
        // init function. Override for specific purpose
        init: function() {},
        handleEvent: function() {
        },
        update: function() {
            for ( var i in this.entities ) {
                if ( this.entities[i].objType != "Plane" ) {
                    // check collisions
                    for ( var j in this.entities ) {
                        if ( j != i ) {
                            var contact = this.entities[i].generateContact( this.entities[j] );
                            if ( contact.distance <= 0 ) {
                                this.entities[i].velocity = this.entities[i].velocity.add( this.entities[j].position.x ( -2 * this.entities[i].velocity.dot( this.entities[j].position ) ) );
                            }
                        }
                    }
                }
                
                // Update gravity and integrate
                this.entities[i].update( this.info );
            }
        },
        render: function() {
            this.info.ctx.clearRect( 0, 0, this.info.width, this.info.height );
            for ( var i in this.entities ) {
                this.entities[i].draw( this.info );
            }
        },
        addEntity: function( entity ) {
            entity.id = this.id++;
            this.entities[ entity.id ] = entity;
        },
        removeEntity: function( entity ) {
            delete this.entities[ entity.id ];
        },

        //handle event & dispatch to all entites
        triggerEvent:function(event) {
            for ( var i in this.entities) {
                this.entities[i].trigger(event.type);
            }
        }
    };

    // Global Loop function
    // -----------------
    Game.run = function ( scene ) {
        // User define init
        scene.init();

        // get last time. Use for calculating fps
        scene.info.time = (new Date()).getTime();
        scene.info.timeDiff = 0;

        // Main loop
        function loop() {
            //scene.handleEvent(event);

            // Update the scene
            scene.update();

            // render the scene
            scene.render();

            // Calculate current time and timeDiff
            var now = (new Date()).getTime();
            scene.info.timeDiff = now - scene.info.time;
            scene.info.time = now;

            // Request the new loop
            requestAnimFrame(function() {
                loop();
            });
        };
        // trigger the world 
        loop();
    };    
    
    // Rigid Body class
    // ----------------------
    var RigidBody = Game.RigidBody = Class( null, {
        initialize: function( attributes ) {
            var defaults = {
                objType: "Body",
                position: $V( [0, 0] ),
                velocity: $V( [0, 0] ),
                mass: undefined,
                restitution: 1
            };
            this.setAttrs( defaults, attributes, RigidBody );
            _.extend( this, Game.Events ); // all body need event?

            //set on event for keyboard
            this.on('keyup');
            this.on('keydown');
        },
        setAttrs: function( defaults, attributes, ClassName ) {
            _.extend( this, defaults, attributes );
            Util.addSetters.call( this, ClassName, _.keys( defaults ) );
            Util.addGetters.call( this, ClassName, _.keys( defaults ) );
        },
        update: function( dt ) {}
    });
    
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
    //binding event

    // Define objects
    var Circle = Game.Class( Game.RigidBody, {
        initialize: function( attributes ) {
            var defaults = {
                radius: 0,
                objType: "Circle"
            };
            this.setAttrs( defaults, attributes, Circle );
            //assign event handler
            this.on("keyup", this.handleKeyup);    
            this.on("keydown", this.handleKeydown);
        },
        draw: function( info ) {
            var ctx = info.ctx;
            ctx.save();
            ctx.fillStyle = this.style.fillStyle ? this.style.fillStyle : "";
            ctx.strokeWidth = this.style.strokeWidth ? this.style.strokeWidth : "";
            ctx.beginPath();
            ctx.arc( Math.floor(this.position.e(1)), 
                     Math.floor(this.position.e(2)), 
                     this.radius, 0, 2 * Math.PI, true );
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        },
        update: function( info ) {
            // apply gravity
            this.velocity = this.velocity.add( info.gravity.x( info.timeDiff / 1000 ) );
            
            // integrate
            if ( this.position != undefined && this.velocity != undefined ) {
                this.position = this.position.add( this.velocity );
            }
        },

        generateContact: function( body ) {
            // contact object
            // include: distance and collision vector
            var contact = {};
            if ( body.objType == "Plane" ) {
                contact.distance = this.position.dot( body.position ) + body.distance;
                contact.normal = undefined;
            }
            return contact;
        },

       //handle key up
        handleKeyup: function() {
            var test = 1;
        },

        //handle key down
        handleKeydown: function() {
            var test = 1;
        }

    });

    var Plane = Game.Class( Game.RigidBody, {
        initialize: function( attributes ) {
            var defaults = {
                objType: "Plane",
                distance: 470,
                position: $V( [ 0, -1 ] ),
                fillStyle: "red"
            };
            this.setAttrs( defaults, attributes, Plane );
            this.on("keyup", this.handleKeyup);     //[note] just for test, plane needs no event
            this.on("keydown", this.handleKeydown); //[note] just for test, plane needs no event  
        },
        draw: function( info ) {
            var ctx = info.ctx;
            ctx.fillStyle = this.style.fillStyle ? this.style.fillStyle : "";
            ctx.strokeWidth = this.style.strokeWidth ? this.style.strokeWidth : "";

            ctx.save();
            ctx.translate( info.width / 2, info.height - 5 );
            ctx.fillRect( -info.width / 2, -5 , info.width, 10 );
            ctx.stroke();
            ctx.restore();
        },

        handleKeyup: function() {
            var test = 1;
        },

        handleKeydown: function() {
            var test = 1;
        }
    });

    var scene = _.extend({}, Game.Scene);
    scene.init = function() {
        var canvas = document.getElementById("container");
        var ctx = canvas.getContext("2d");
        
        scene.info = {
            gravity: $V( [0, 10] ),
            width: canvas.width,
            height: canvas.height,
            ctx: ctx
        };

        var c = new Circle({
            radius: 10,
            velocity: $V( [0, 2] ),
            mass: 1,
            position: $V( [230, 100] ),
            style: {
                fillStyle: "#989fdf",
                strokeWidth: 1
            }
        });
        
        var p = new Plane({
            style: {
                fillStyle: "red",
                strokeWidth: 1
            }
        });
        
        this.addEntity( c );
        this.addEntity( p );
    };

    //binding event
    window.addEventListener('keydown',handler,true);
    window.addEventListener('keyup',handler,true);
    //implicit call to change handler scope from DOM to instance scope
    function handler(event) {
        Game.Scene.triggerEvent(event);
    };

    Game.run( scene );
};
