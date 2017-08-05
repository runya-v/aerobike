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
    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();

    function rotate(angle) {
        /// Получить вектор направления байка
        /// Сместить байк на значение скорости

    }

    function onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                rotate(-ROTATE_ANGLE);
                break;
            case _scope.keys.RIGHT:
                rotate(ROTATE_ANGLE);
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
                break;
            case _scope.keys.RIGHT:
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

    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
    //window.addEventListener('keydown', onKeyDown, false);
    //window.addEventListener('keyup', onKeyUp, false);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        if (bike_ && terrain_) {
            /// Обновить скорость перемещения.
            updateSpeed(dt_);
			/// Получить текущую позицию.
			var pos = bike_.position;
			/// Получить высоту в позиции.
			var height_vec = terrain_.getVertexByPos(pos);
            /// Плавно откорректировать высоту.
			bike_.position.y = height_vec.y;
        };
    };
};
CONTROLLERS.BikeController.prototype = Object.create(THREE.EventDispatcher.prototype);


/**
 * \brief  Контроллер камеры, относительно мотоцикла.
 */
CONTROLLERS.CameraController = function(camera_, bike_, terrain_, dom_element_) {
    var _scope = this;
    var LOOK_DISTANCE = 30; ///< Дистанция до байка от камеры.
    var HEIGHT_DISTANCE = 0.01; ///< Высота камеры над байком.

    /// Установка положения камеры за мотоциклом.
    var to_bike_direction = bike_.getWorldDirection();
    to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
    to_bike_direction.y = HEIGHT_DISTANCE;
    var _old_bike_pos = bike_.position;
    camera_.position.addVectors(bike_.position, to_bike_direction);
    camera_.lookAt(bike_.position);

    /// Инициализация орбитального контроллера камеры.
    var _orbit_controls = new THREE.OrbitControls(camera_);
    //_orbit_controls.target.set(bike_.position);
    _orbit_controls.noKeys = true;
    _orbit_controls.userPanSpeed = 100;
    _orbit_controls.maxDistance = LOOK_DISTANCE;

    this.update = function(dt_) {
        if (camera_ && bike_ && terrain_) {
            var bike_position = bike_.position;
            // var bike_direction = bike_.getWorldDirection();
            // var to_bike_direction = bike_direction;
            // /// Вычислить положение камеры за мотоциклом.
            // to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
            // /// Поднять положение камеры над мотоциклом.
            // to_bike_direction.y = HEIGHT_DISTANCE;
            /// Переместить камеру в заданную точку и повернуть на мотоцикл.
            //camera_.position.addVectors(to_bike_direction, bike_position);
            //var pos_direction = new THREE.Vector3();
            //pos_direction.subVectors(bike_position, _old_bike_pos);
            //_orbit_controls.position0.add(pos_direction);
            _orbit_controls.target = bike_position;
            _orbit_controls.update(dt_);
            _old_bike_pos = bike_position;
            //camera_.lookAt(bike_position);
            //camera_.position = bike_position;
        }
    }
};
