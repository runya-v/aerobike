/**
 * \brief  Модуль контроллеров для игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   04.04.2017
 */

var CONTROLLERS = {};


/**
 * \brief  Контроллер движений мотоцикла.
 */
CONTROLLERS.BikeController = function(bike_, terrain_, dom_element_) {
    THREE.EventDispatcher.call(this);
    var _scope = this;

    var EPS = 0.000001;
    var PIXELS_PER_ROUND = 1800;
    var ROTATE_ANGLE = 2;
    var SPEED_UP = 2;
    var SPEED_DOWN = 2;
    var HEIGHT = 0;

    _scope.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };

    _scope.object = bike_;
    _scope.domElement = (dom_element_ !== undefined) ? dom_element_ : document;

    _scope.center = new THREE.Vector3();

    _scope.minPolarAngle = 0; // radians
    _scope.maxPolarAngle = Math.PI; // radians
    _scope.minDistance = 0;
    _scope.maxDistance = Infinity;

    var _speed = 0;
    var _is_up_speed = false;
    var _is_down_speed = false;

    var _is_rotate = false;
    var _cur_rotate_angle = 0;

    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();

    function updateRotation() {
        if (_is_rotate) {
            var rot_matrix = new THREE.Matrix4();
            var axis = new THREE.Vector3(0, 1, 0);
            var radians = _cur_rotate_angle * Math.PI / 180;
            rot_matrix.makeRotationAxis(axis.normalize(), radians);
            bike_.matrix.multiply(rot_matrix);
            bike_.rotation.setFromRotationMatrix(bike_.matrix);
        }
    }

    function onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                _is_rotate = true;
                _cur_rotate_angle = ROTATE_ANGLE; 
                break;
            case _scope.keys.RIGHT:
                _is_rotate = true;
                _cur_rotate_angle = -ROTATE_ANGLE; 
                break;
            case _scope.keys.UP:
                _is_up_speed = true;
                break;
            case _scope.keys.BOTTOM:
                _is_down_speed = true;
                break;
        }
    }

    function onDocumentKeyUp(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                _is_rotate = false;
                break;
            case _scope.keys.RIGHT:
                _is_rotate = false;
                break;
            case _scope.keys.UP:
                _is_up_speed = false;
                break;
            case _scope.keys.BOTTOM:
                _is_down_speed = false;
                break;
        }
    }

    function updateSpeed(dt_) {
        var ds = ((bike_.getMaxSpeed() * dt_ * 5000) / (bike_.getSpeedUp()));
        if (_is_up_speed) {
            if (_speed < bike_.getMaxSpeed()) {
                _speed += ds;
            } else {
                _speed = bike_.getMaxSpeed();
            }
        } else if (! _is_down_speed) {
            if (0 < _speed) {
                _speed -= ds;
            } else {
                _speed = 0;
            }
        }
        if (_is_down_speed) {
            if (-bike_.getMaxSpeed() < _speed) {
                _speed -= ds;
            } else {
                _speed = -bike_.getMaxSpeed();
            }
        } else if (! _is_up_speed) {
            if (_speed < 0) {
                _speed += ds;
            } else {
                _speed = 0;
            }
        }
        var su = UTILS.Easing.inOutCubic(_speed);
        /// Получить вектор направления байка
        var bike_direction = bike_.getWorldDirection();
        /// Сместить байк на значение скорости
        bike_.translateOnAxis(bike_direction, su);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        if (bike_ && terrain_) {
            /// Обновить скорость перемещения.
            updateSpeed(dt_);
            /// Обновить направление байка.
            updateRotation();
			/// Получить текущую позицию.
			var pos = bike_.position;
			/// Получить высоту в позиции.
			var height_vec = terrain_.getVertexByPos(pos);
            /// Плавно откорректировать высоту.
			bike_.position.y = height_vec.v.y;
        };
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
    //window.addEventListener('keydown', onKeyDown, false);
    //window.addEventListener('keyup', onKeyUp, false);
};
CONTROLLERS.BikeController.prototype = Object.create(THREE.EventDispatcher.prototype);


/**
 * \brief  Контроллер камеры, относительно мотоцикла.
 */
CONTROLLERS.BikeCameraController = function(camera_, bike_, terrain_, dom_element_) {
    var _scope = this;
    var MIN_LOOK_DISTANCE = 30; ///< Константа - минимальная дистанция до байка от камеры.
    var MAX_LOOK_DISTANCE = 50; ///< Константа - максимальная дистанция до байка от камеры.
    var HEIGHT_DISTANCE = 1; ///< Константа - высота камеры над байком.
    var ZOOM_SPEED = 1.0; ///< Константа - скорость зума.
    var LOOK_DISTANCE = 9; ///< Константа - дистанция от камеры до байка.

    var _old_bike_pos = new THREE.Vector3();

    if (bike_) {
        _old_bike_pos = bike_.position.clone();
    }

    /// Установка положения камеры за мотоциклом.
    var to_bike_direction = bike_.getWorldDirection();
    to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
    to_bike_direction.y = HEIGHT_DISTANCE;
    camera_.position.addVectors(bike_.position, to_bike_direction);
    //camera_.position.x = 5;
    camera_.lookAt(bike_.position);

    function getDirection(va_, vb_) {
        var vd = new THREE.Vector3();
        vd.subVectors(vb_, va_);
        return vd;
    }

    function lookToBike() {
        if (bike_.position !== _old_bike_pos) {
            /// Добавить вектор смещения байка к текущей позиции камеры.
            camera_.position.add(getDirection(_old_bike_pos, bike_.position));
            camera_.lookAt(bike_.position);
            /// Запомнить текущее положение байка.
            _old_bike_pos = bike_.position.clone();
        }
    }

    function updateDistance() {


    }

    function onMouseWheel(event) {
        var d = getDirection(camera_.position, bike_.position);
        var cam_dist = d.length();
        var scale = 1;
        if (event.deltaY < 0) {
            scale *= Math.pow(0.95, ZOOM_SPEED);
        } else if (event.deltaY > 0) {
            scale /= Math.pow(0.95, ZOOM_SPEED);
        }
        d.normalize();
        cam_dist = Math.max(MIN_LOOK_DISTANCE, Math.min(MAX_LOOK_DISTANCE, cam_dist));
        d.multiplyScalar(cam_dist + scale);
        camera_.position.add(d);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        if (camera_ && bike_ && terrain_) {
            lookToBike();
        }
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // this.domElement.addEventListener('wheel', onMouseWheel, false);
};
