/*!
 * \brief  Модуль игровых объектов игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var MODELS = {};

MODELS.Pilot = function() {};


MODELS.BikePelican = function() {
    THREE.Group.call(this);
    var _scope = this;
    var _animation;

    // Загрузка байка
    loadModel("bike_01.png", "bike_01.dae");
    // Загрузка рокетного двигателя
    loadModel("mono_jet_01.png", "mono_jet_01.dae");

    function loadModel(texture_file, model_file) {
        var obj_texture = new UTILS.TextureLoader();
        obj_texture.load("./textures/" + texture_file, function(texture) {
            var loader = new THREE.ColladaLoader();
            loader.convertUpAxis = true;
            loader.load("./collada/" + model_file, function(collada) {
                var model = collada.scene;
                collada.scene.traverse(function(child) {
                    model.position.y = 1;
                    model.children[0].children[0].material = new THREE.MeshBasicMaterial({map:texture});
                });
                _scope.add(collada.scene);
            });
        });
    }

    this.update = function() {

    };
};
MODELS.BikePelican.prototype = Object.create(THREE.Group.prototype);


MODELS.Cloud = function(min_x, min_y, min_z, max_x, max_y, max_z) {
    THREE.Group.call(this);
    var _scope = this;

    var MIN_RADIUS_PERC = 0.05;
    var MAX_RADIUS_PERC = 0.5;
    var MIN_NUM_FRACTIONS = 5;
    var MAX_NUM_FRACTIONS = 20;

    var _fractions = [];
    var _diagonal = diagonal();

    var _loader = new THREE.TextureLoader();
    _loader.load("textures/cloud_fraction_circle.png", function(texture) {
    //_loader.load("textures/cloud_fraction_light.png", function(texture) {
        var amount = getRandValue(MIN_NUM_FRACTIONS, MAX_NUM_FRACTIONS);
        for (var i = 0; i < amount; ++i) {
            var s = addFraction(new THREE.SpriteMaterial({map:texture, color:0xffffff, fog:true}));
            _fractions[i] = s;
            _scope.add(s);
        }
    });

    function addFraction(material) {
        //material.color.setRGB(0.1 + 0.9 * Math.random(), 0.8 + 0.2 * Math.random(), 1);
        var s = new THREE.Sprite(material);
        s.position.set(getCoordinate(max_x), getCoordinate(max_y), getCoordinate(max_z));
        s.position.normalize();
        var radius = (_diagonal - getRandValue(_diagonal * MIN_RADIUS_PERC, _diagonal * MAX_RADIUS_PERC));
        s.scale.set(radius, radius, radius);
        s.position.multiplyScalar(_diagonal);
        return s;
    }

    function getCoordinate(max) {
        var probs = [0.59, 0.55, 0.51, 0.5, 0.49, 0.45, 0.42, 0.41, 0.405, 0.4, 0.39, 0.35,
                     0.32, 0.3, 0.29, 0.25, 0.2, 0.15, 0.1, 0.05, 0.02, 0.01];
        return max * 0.5 - max * Math.floor(probs.length * Math.random());
    }

    function diagonal() {
        var v = new THREE.Vector3(getRandValue(min_x, max_x), getRandValue(min_y, max_y), getRandValue(min_z, max_z));
        return v.length();
    }

    function getRandValue(min, max) {
        return min + ((max - min) * Math.random());
    }

    this.update = function() {
        //for (var i = 0; i < _fractions.length; ++i) {
        //    var s = _fractions[i];
        //    var k = 0.001;
        //    s.position.x += (max_x * Math.random()) * (Math.random() < 0.5 ? -k:k);
        //    s.position.y += (max_y * Math.random()) * (Math.random() < 0.5 ? -k:k);
        //    //s.position.z += (max_z * 0.5 - max_z * Math.random()) * 0.005;
        //}
    }
};
MODELS.Cloud.prototype = Object.create(THREE.Group.prototype);
