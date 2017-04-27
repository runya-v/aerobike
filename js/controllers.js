/*!
 * \brief  Модуль контроллеров для игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   04.04.2017
 */

var CONTROLLERS = {};


CONTROLLERS.BikeControls = function(bike, terrain, domElement) {
    var EPS = 0.000001;
    var PIXELS_PER_ROUND = 1800;
    var ROTATE_ANGLE = 2;
    var SPEED_UP = 2;
    var SPEED_DOWN = 2;

    this.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };

    this.object = object;
    this.domElement = (domElement !== undefined) ? domElement : document;

    this.center = new THREE.Vector3();

    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians
    this.minDistance = 0;
    this.maxDistance = Infinity;

    var _self = this;
    var _speed = 0;
    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();

    function rotate(angle) {

    }

    function speedUp(su) {

    }

    function onKeyDown(event) {
        switch (event.keyCode) {
            case LEFT:
                rotate(-ROTATE_ANGLE);
                break;
            case RIGHT:
                rotate(ROTATE_ANGLE);
                break;
            case UP:
                speedUp(SPEED_UP);
                break;
            case BOTTOM:
                speedUp(-SPEED_DOWN);
                break;
        }
    }

    // function onKeyUp(event) {
    //     switch (event.keyCode) {
    //         case LEFT:
    //             break;
    //         case RIGHT:
    //             break;
    //         case UP:
    //             break;
    //         case BOTTOM:
    //             break;
    //         }
    //     }
    // };

    window.addEventListener('keydown', onKeyDown, false);
    // window.addEventListener('keyup', onKeyUp, false);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function() {
        if (bike && terrain) {

        }
    }
};
CONTROLLERS.BikeControls.prototype = Object.create(THREE.EventDispatcher.prototype);
