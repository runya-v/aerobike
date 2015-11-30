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

    function BikePelican() {
        var loader = new THREE.ColladaLoader();
        //loader.convertUpAxis = true;
        loader.load( "./collada/bike_01.dae", function(collada) {
            collada.scene.traverse(function(child) {
                if (child instanceof THREE.SkinnedMesh) {
                    var animation = new THREE.Animation(child, child.geometry.animation);
                    animation.play();
                    camera.lookAt( child.position );
                }
            });
            _scope.add(collada.scene);

        });
    } BikePelican();

    this.update = function() {

    };
};
MODELS.BikePelican.prototype = Object.create(THREE.Group.prototype);
