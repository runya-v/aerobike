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

    function BikePelican() {
        // Загрузка байка
        loadModel("bike_01.png", "bike_01.dae");
        // Загрузка рокетного двигателя
        loadModel("mono_jet_01.png", "mono_jet_01.dae");
    } BikePelican();

    function loadModel(texture_file, model_file) {
        var obj_texture = new UTILS.TextureLoader(progress);
        obj_texture.load("./textures/" + texture_file, function(texture) {
            var loader = new THREE.ColladaLoader();
            loader.convertUpAxis = true;
            loader.load("./collada/" + model_file, function (collada) {
                var model = collada.scene;
                collada.scene.traverse(function (child) {
                    model.position.y = 100;
                    model.children[0].children[0].material = new THREE.MeshBasicMaterial({map: texture});
                });
                _scope.add(collada.scene);
            });
        });
    }

    this.update = function() {

    };
};
MODELS.BikePelican.prototype = Object.create(THREE.Group.prototype);
