function init() {    
    var circle = new Kinetic.Circle({
        id: "circle1",
        x: 300,
        y: 100,
        radius: 20,
        fill: "#A18365",
        bodyType: "dynamic",
        shapeType: "circle"
    });
    var ground = new Kinetic.Rect({
        id: "ground",
        x: 0,
        y: 470,
        width: 640,
        height: 10,
        fill: "#A39E1F",
        bodyType: "static",
        shapeType: "rect"
    });
    var graphics_obj = [circle, ground];
    var g = new Game.Graphics("container");
    g.add(graphics_obj);
    g.run();
}
init();

