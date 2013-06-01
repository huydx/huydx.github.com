//namespace setup

var   b2Vec2 = Box2D.Common.Math.b2Vec2
    , b2AABB = Box2D.Collision.b2AABB
    , b2BodyDef = Box2D.Dynamics.b2BodyDef
    , b2Body = Box2D.Dynamics.b2Body
    , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    , b2Fixture = Box2D.Dynamics.b2Fixture
    , b2World = Box2D.Dynamics.b2World
    , b2MassData = Box2D.Collision.Shapes.b2MassData
    , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
    , b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
    , b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;

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




    // Constants
    // ----------------------
    Game.KEYS = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };

    //physic engine
    var PhysicEngine = Game.Physic = {
        initialize: function( attributes ) {
            var defaults = {
                stepRate: 1/20,
                bodyList: new Array()
            };
            _.extend( this, defaults, attributes );
        },

        Step: function (context) { //context is scence, btw
            var world = context.world;
            this.EntityUpdate(context); 
            world.Step(this.stepRate, 10, 10);
            world.ClearForces();
        },

        CreateBody: function(context, entity) { //context is character/any rigid body
            var entityFixDef = new b2FixtureDef;
            entityFixDef.density = entity.density;             //1.0
            entityFixDef.friction = entity.friction;           //0.0
            entityFixDef.restitution = entity.restitution;     //0.5

            var entityBodyDef = new b2BodyDef;
            entityBodyDef.type  = entity.physicType == "dynamic"?b2Body.b2_dynamicBody:b2Body.b2_staticBody; //lack kinetic body, add later
            entityBodyDef.position.x = entity.x; //default x
            entityBodyDef.position.y = entity.y; //default y
            entityBodyDef.userData = entity;

            var world = context.world;
            var entityBody =  world.CreateBody(entityBodyDef);
            if (entity.objType == "character") {
                entityFixDef.shape = new b2CircleShape(20); //temporally cirle
            }
            else if (entity.objType == "ground") {
                entityFixDef.shape =  new b2PolygonShape;
                entityFixDef.shape.SetAsBox(600, 50);
            } //temporally cirle
            //[todo] entity contain list of convex, or edge
            //need to create shape with list of complex convex
            entityBody.CreateFixture(entityFixDef);
            
            this.bodyList.push(entityBody); //push to management list
            entity.physicBody = entityBody; //create 1-1 relationship
            return entityBody;
        },

        EntityUpdate: function(context) {
            var world = context.world;
            for(var i=0; i < this.bodyList.length; i++) {
                this.bodyList[i].m_userData.x = this.bodyList[i].GetPosition().x;
                this.bodyList[i].m_userData.y = this.bodyList[i].GetPosition().y;
            }
        }
    }

    // Utility functions
    // ----------------------
    Game.Util = {
        loadImages: function( sources, callback ) {
            var images = {},
                loadedImages = 0,
                numImages = 0;
            for ( var src in sources ) {
                ++numImages;
            }
            for ( var src in sources ) {
                images[ src ] = new Image();
                images[ src ].onload = function() {
                    if ( ++loadedImages >= numImages ) {
                        callback( images );
                    }
                };
                images[ src ].src = sources[ src ];
            }
        },
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
        world : {}, //box2d world
        id: 0,
        entities: {},
        ctx: undefined,
        width: 0,
        height: 0,
        // init function. Override for specific purpose
        init: undefined,
        // Update character
        update: function() {
            // Update gravity and integrate
            for ( var i in this.entities ) {
                var entity = this.entities[i];
                if ( entity.objType === "character" ) {
                    this.entities[i].update( this );
                }
            }
        },
        render: function() {
            this.ctx.clearRect( 0, 0, this.width, this.height );
            for ( var i in this.entities ) {
                this.entities[i].draw( this );
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
        triggerEvent:function( event ) {
            var eventString = event.type.toString();
            for ( var i in this.entities ) {
                if ( _.isFunction( this.entities[i].trigger ) ) {
                    this.entities[i].trigger( eventString, event );
                }
            }
        }
    };

    // Global Loop function
    // -----------------
    Game.run = function ( scene, physicEngine ) {
        // User define init
        scene.init();

        // get last time. Use for calculating fps
        scene.time = (new Date()).getTime();
        scene.timeDiff = 0;

        // Main loop
        function loop() {
            physicEngine.Step(scene);

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

var RigidBody = Game.RigidBody = Game.Class( null, {
    physicBody: {},
    initialize: function( attributes ) {
        var defaults = {
            physicType : "",
            objType: "",
            x: 0,
            y: 0,
            density: 1.0,   //1.0
            friction: 0.0,  //0.0
            restitution: 0.5 //0.5
        };
        this.setAttrs( defaults, attributes, RigidBody );
        _.extend( this, Game.Events ); // all body need event?
    },
    setAttrs: function( defaults, attributes, ClassName ) {
        _.extend( this, defaults, attributes );
        Game.Util.addSetters.call( this, ClassName, _.keys( defaults ) );
        Game.Util.addGetters.call( this, ClassName, _.keys( defaults ) );
    },
    update: function( dt ) {}
});

var Character = Game.Class( Game.RigidBody, {
    initialize: function( attributes ) {
        var defaults = {
            physicType : "dynamic",
            objType: "character",
            x: 0,
            y: 0,
            vx: 8,
            vy: 5,
            state: 0,       // before walk
            direction: 3,   // Turn right
            width: 64,
            height: 64,
        };
        _.extend( this, defaults, attributes );
        _.extend( this, Game.Events );
        this.on( "keydown", this.keyDown ); 
    },
    draw: function( scene ) {
        var ctx = scene.ctx;
        ctx.drawImage(this.image, this.state * this.width, this.direction * this.height,
                      this.width, this.height, this.x, this.y, this.width, this.height);
    },
    update: function( scene ) {
    },
    // When a key is pressed
    keyDown: function( event ) {
        var keyID = event.keyCode;
        var vel = this.physicBody.GetLinearVelocity();

        switch( keyID ) {
        case Game.KEYS.RIGHT:
            this.direction = 3;
            if ( ++this.state > 8 ) {
                this.state = 1;
            }
            this.x += this.vx;
            vel.x = 20;
            break;
        case Game.KEYS.LEFT:
            this.direction = 1;
            if ( ++this.state > 8 ) {
                this.state = 1;
            }
            vel.x = -20;
            this.x -= this.vx;
            break;
        case Game.KEYS.UP:
            this.y -= this.vy;
            vel.y = -20;
            break;
        case Game.KEYS.DOWN:
            this.y += this.vy;
            vel.y = 20;
            break;
        }
    }
});

var Ground = Game.Class(Game.RigidBody, {
    initialize: function( attributes ) {
        var defaults = {
            physicType : "static",
            objType: "ground",
            width: 64,
            height: 64,

        };
        _.extend( this, defaults, attributes );
    },
    draw: function( scene ) {
        var ctx = scene.ctx;
        ctx.fillStyle = "#333333";
        ctx.rect(0, 350, 600, 100);
        //ctx.fill();
    },
});

var Background = Game.Class( null, {
    initialize: function( attributes ) {
        var defaults = {
            objType: "background",
        };
        _.extend( this, defaults, attributes );
    },
    draw: function( scene ) {
        var ctx = scene.ctx;
        ctx.drawImage( this.image, 0, 0, scene.width, scene.height );
    },
});


window.onload = function() {
    var canvas = document.getElementById("container"),
        ctx = canvas.getContext("2d"),
        scene = _.extend( {}, Game.Scene ),
        physic = _.extend( {}, Game.Physic); //create physic engine

    scene.world  = new b2World (new b2Vec2(0, 10), false);
    scene.ctx = ctx;
    scene.width = canvas.width,
    scene.height = canvas.height

    var imagesSource = {
        character: "res/character.png",
        ground: "res/ground.png",
        sky: "res/sky.png",
        ground: "res/ground.png"
    };

    window.addEventListener( "keydown", function( event ) {
        scene.triggerEvent( event );
    }, false );

    Game.Util.loadImages( imagesSource, function( images ) {
        scene.init = function() {
           var bg = new Background({
                image: images.sky
            });

            var chara = new Character({
                image: images.character,
                x: 200,
                y: 200
            });

            var ground = new Ground({
                x: 0,
                y:400
            });
            this.addEntity( bg );
            this.addEntity( chara );
            this.addEntity( ground );
            physic.initialize();
            physic.CreateBody(this, chara); //??   
            physic.CreateBody(this, ground);
        };

        // Start the loop
        Game.run( scene, physic );
    });
    
};
