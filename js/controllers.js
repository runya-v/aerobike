/*!
 * \brief  Модуль контроллеров для игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   04.04.2017
 */

var CONTROLLERS = {};


CONTROLLERS.BikeControls = function(Bike, terrain, domElement) {
    var EPS = 0.000001;
    var PIXELS_PER_ROUND = 1800;

    this.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.center = new THREE.Vector3();

    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians
    this.minDistance = 0;
    this.maxDistance = Infinity;

    var _self = this;
    var _last_position = new THREE.Vector3();

    
};
CONTROLLERS.BikeControls.prototype = Object.create(THREE.EventDispatcher.prototype);
