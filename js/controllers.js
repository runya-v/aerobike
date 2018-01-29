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
    var _mspeed = 0;
    var _is_up_speed = false;
    var _is_down_speed = false;

    var _is_rotate = false;
    var _to_route_distance = 0;

    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();
    var _vertex_by_pos = terrain_.getVertexByPos(bike_.position);

    function updateRotation(dt_) {
        if (_is_rotate) {
            var rot_matrix = new THREE.Matrix4();
            var axis = new THREE.Vector3(0, 1, 0);
            var radians = bike_.rotate_angle * Math.PI / 180;
            rot_matrix.makeRotationAxis(axis.normalize(), radians);
            bike_.matrix.multiply(rot_matrix);
            bike_.rotation.setFromRotationMatrix(bike_.matrix);
        }
    }

    function onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                _is_rotate = true;
                bike_.rotate_angle = ROTATE_ANGLE; 
                break;
            case _scope.keys.RIGHT:
                _is_rotate = true;
                bike_.rotate_angle = -ROTATE_ANGLE; 
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
        /// Получить максиамльную скорость для промежутка времени с приведением к секунде.
        var max_speed = bike_.MAX_SPEED * dt_ * 1000;
        var min_speed = bike_.MIN_SPEED * dt_ * 1000;
        /// Коррекция максимальной скорости на промежутке времени.
        if (_mspeed < max_speed) {
            _mspeed = max_speed;   
        }
        /// Получить приращения скорости. 
        var us = _mspeed / bike_.SPEED_UP;
        var bs = _mspeed / bike_.BREAKING;
        var ds = _mspeed / bike_.SPEED_DOWN;
        if (_is_up_speed) {
            if ((bike_.speed + us) <= _mspeed) {
                bike_.speed += us;
            } else {
                bike_.speed = _mspeed;
            }
        } else if (_is_down_speed) {
            if (0 <= (bike_.speed - bs)) {
                bike_.speed -= bs;
            } else {
                bike_.speed = 0;
            }
        } else {
            if (0 <= (bike_.speed - ds)) {
                bike_.speed -= ds;
            } else {
                bike_.speed = 0;
            }
            _mspeed = 0;
        }
        /// Оработать процесс перемещения.
        if (0 < bike_.speed) {
            /// Получить вектор направления байка
            var bike_direction = bike_.getWorldDirection().clone();
            bike_direction.normalize();
            bike_direction.multiplyScalar(bike_.speed);
            /// Плавно откорректировать позицию.
            var bike_new_pos = bike_.position.clone(); 
            bike_new_pos.x += bike_direction.x;
            bike_new_pos.z += bike_direction.z;
            _vertex_by_pos = terrain_.getVertexByPos(bike_new_pos);
            var epos = 1 - UTILS.Easing.inQuint(_vertex_by_pos.d2r / _vertex_by_pos.rwidth);
            bike_.speed *= epos;
            if (bike_.speed < min_speed) {
                bike_.speed = min_speed;
            }
            bike_direction.normalize();
            bike_direction.multiplyScalar(bike_.speed);
            /// Сместить байк на значение скорости
            bike_.position.x += bike_direction.x;
            bike_.position.z += bike_direction.z;
        }
    }

    function updateHeighAndtPosition(dt_) {
        bike_.timer += dt_;
        /// Получить высоту в позиции.
        bike_.cur_world_height = _vertex_by_pos.v.y;
        /// Плавно откорректировать высоту.
        var ehover = UTILS.Periodics.sinus(bike_.timer * 1000,  bike_.HOVER_FREQUENCE) * bike_.HOVER_AMPLITUDE + bike_.HOVER_DISTANCE;
        if (0 <= _vertex_by_pos.v.y) {
            bike_.position.y = bike_.cur_world_height + ehover;
        } else {
            bike_.position.y = ehover;
        }
    } 
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        _middle_dt = (_middle_dt + dt_) * 0.5;
        if (bike_ && terrain_) {
            /// Обновить скорость перемещения.
            updateSpeed(_middle_dt);
            /// Обновить направление байка.
            updateRotation(_middle_dt);
            /// Обновить положение байка над поверхностью.
            updateHeighAndtPosition(_middle_dt);
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
    var MIN_LOOK_DISTANCE = 30; ///< Константа - минимальная дистанция до байка от камеры.
    var MAX_LOOK_DISTANCE = 50; ///< Константа - максимальная дистанция до байка от камеры.
    var HEIGHT_DISTANCE = 1; ///< Константа - высота камеры над байком.
    var ZOOM_SPEED = 1.0; ///< Константа - скорость зума.
    var LOOK_DISTANCE = 9; ///< Константа - дистанция от камеры до байка.
    
    var _scope = this;
    var _angle = Math.PI * -0.5;

    var _old_bike_pos = new THREE.Vector3(bike_.position.x, bike_.cur_world_height, bike_.position.z);
    var _old_bike_direction = new THREE.Vector3();
    var _subv = new THREE.Vector3();

    /// Установка положения камеры за мотоциклом.
    var to_bike_direction = bike_.getWorldDirection();
    _old_bike_direction = to_bike_direction.clone();
    to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
    to_bike_direction.y = HEIGHT_DISTANCE;
    var _bike_position = new THREE.Vector3(bike_.position.x, bike_.cur_world_height, bike_.position.z);
    camera_.position.addVectors(_bike_position, to_bike_direction);
    camera_.lookAt(_bike_position);

    function lookToBike() {
        /// Вращение камеры за байкаом.
        var bike_direction = bike_.getWorldDirection().clone();
        bike_direction.y = 0;
        var cam_direction = camera_.getWorldDirection().clone();
        cam_direction.y = 0;
        _bike_position.x = bike_.position.x;
        _bike_position.y = bike_.cur_world_height;
        _bike_position.z = bike_.position.z;
        var angle = cam_direction.angleTo(bike_direction) / Math.PI;
        if (0.001 < angle) {
            _subv.subVectors(_bike_position, camera_.position);
            var eas = UTILS.Easing.inOutCubic(angle);
            _angle += (bike_.rotate_angle < 0) ? eas : -eas;
            _subv.x += Math.cos(_angle) * LOOK_DISTANCE;
            _subv.z += Math.sin(_angle) * LOOK_DISTANCE;
            camera_.position.add(_subv);
            _old_bike_direction = bike_direction.clone();
        }
        /// Смещение камеры вместе с байком.
        if (!_bike_position.equals(_old_bike_pos) || 0.001 < angle) {
            /// Добавить вектор смещения байка к текущей позиции камеры.
            _subv.subVectors(_bike_position, _old_bike_pos);
            camera_.position.add(_subv);
            camera_.lookAt(_bike_position);
            /// Запомнить текущее положение байка.
            _old_bike_pos = _bike_position.clone();
        }
    }

    function onMouseWheel(event) {
        var d = getDirection(camera_.position, _bike_position);
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
