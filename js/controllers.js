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
    var SPEED_UP = 1;
    var SPEED_DOWN = 1;
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

    var _middle_dt = 0;
    var _speed = 0;
    var _is_up_speed = false;
    var _is_down_speed = false;

    var _is_rotate = false;
    var _cur_rotate_angle = 0;

    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();

    function updateRotation(dt_) {
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
var ospeed = 0;
    function updateSpeed(dt_) {
        if (!_middle_dt) {
            _middle_dt = dt_;
        } else {
            _middle_dt = (_middle_dt + dt_) * 0.5;
        }
        var max_speed = bike_.MAX_SPEED * 1000 * _middle_dt; 
        var us = max_speed / bike_.SPEED_UP;
        var bs = max_speed / bike_.BREAKING;
        var ds = max_speed / bike_.SPEED_DOWN;
        if (_is_up_speed) {
            if ((_speed + us) <= max_speed) {
                _speed += us;
            } else {
                _speed = max_speed;
                console.log('>' + max_speed + '!');
            }
        } else if (_is_down_speed) {
            if (0 <= (_speed - bs)) {
                _speed -= bs;
            } else {
                _speed = 0;
            }
        } else {
            if (0 <= (_speed - ds)) {
                _speed -= ds;
            } else {
                _speed = 0;
            }
        }
        
        /// Плавное нарастание скорости по функции.
        var su = _speed; //UTILS.Easing.inOutCubic(_speed);
        /// Получить вектор направления байка
        var bike_direction = bike_.getWorldDirection().clone();
        bike_direction.normalize();
        bike_direction.multiplyScalar(su);
        /// Сместить байк на значение скорости
        bike_.position.x += bike_direction.x;
        bike_.position.z += bike_direction.z;
        if (ospeed !== _speed) {
            console.log('> ' + dt_ + ' | ' + _speed + ' | ' + JSON.stringify(bike_direction));
            ospeed = _speed;
        }
    }

    function updateHeight(dt_) {
        bike_.timer += dt_;
        /// Получить текущую позицию.
        var pos = bike_.position;
        /// Получить высоту в позиции.
        var height_vec = terrain_.getVertexByPos(pos);
        bike_.cur_wirld_height = height_vec.v.y;
        var hover = UTILS.Periodics.sinus(bike_.timer * 1000,  bike_.HOVER_FREQUENCE) * bike_.HOVER_AMPLITUDE + bike_.HOVER_DISTANCE;
        console.log('>' + bike_.timer + ', ' + (bike_.HOVER_FREQUENCE * dt_) + ', ' + hover);
        /// Плавно откорректировать высоту.
        if (0 <= height_vec.v.y) {
            bike_.position.y = bike_.cur_wirld_height + hover;
        } else {
            bike_.position.y = hover;
        }
    } 
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        if (bike_ && terrain_) {
            /// Обновить скорость перемещения.
            updateSpeed(dt_);
            /// Обновить направление байка.
            updateRotation(dt_);
            /// Обновить положение байка над поверхностью.
            updateHeight(dt_);
        };
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
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
        _old_bike_pos = new THREE.Vector3(bike_.position.x, bike_.cur_wirld_height, bike_.position.z);
    }
    var _bike_position = {};

    /// Установка положения камеры за мотоциклом.
    var to_bike_direction = bike_.getWorldDirection();
    to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
    to_bike_direction.y = HEIGHT_DISTANCE;
    _bike_position = new THREE.Vector3(bike_.position.x, bike_.cur_wirld_height, bike_.position.z);
    camera_.position.addVectors(_bike_position, to_bike_direction);
    camera_.lookAt(_bike_position);

    function getDirection(va_, vb_) {
        var vd = new THREE.Vector3();
        vd.subVectors(vb_, va_);
        return vd;
    }

    function lookToBike() {
        _bike_position = new THREE.Vector3(bike_.position.x, bike_.cur_wirld_height, bike_.position.z);
        if (!_bike_position.equals(_old_bike_pos)) {
            /// Добавить вектор смещения байка к текущей позиции камеры.
            camera_.position.add(getDirection(_old_bike_pos, _bike_position));
            camera_.lookAt(_bike_position);
            /// Запомнить текущее положение байка.
            _old_bike_pos = _bike_position.clone();
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
