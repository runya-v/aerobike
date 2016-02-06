/*!
 * \brief  Модуль игровых объектов игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var MODELS = {};

MODELS.Pilot = function() {};


MODELS.BikePelican = function() {
    THREE.Group.call(this);

    var DGRAD = 5;
    var FLOUTIN_DISTANCE_PERCENT = 0.001;

    var _scope = this;
    var _animation;
    var _alpha = 0;

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

    this.update = function(dclock) {
        //if (_alpha > 360) {
        //    _alpha = 0;
        //}
        //_scope.position.y += Math.sin(_alpha * (Math.PI / 180.0)) * FLOUTIN_DISTANCE_PERCENT;
        //_alpha += dclock * 200;
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
    _loader.load("textures/cloud256.png", function(texture) {
        var amount = getRandValue(MIN_NUM_FRACTIONS, MAX_NUM_FRACTIONS);
        for (var i = 0; i < amount; ++i) {
            var s = addFraction(new THREE.SpriteMaterial({
                map:texture, color:0xffffff, fog:true, rotation:(360.0 * Math.random()) * (Math.PI / 180.0)
            }));
            _fractions[i] = s;
            _scope.add(s);
        }
    });

    function addFraction(material) {
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

    this.update = function(dclock) {
        for (var i = 0; i < _fractions.length; ++i) {
            var s = _fractions[i];
            var k = 0.001;
            s.position.x += (max_x * Math.random()) * (Math.random() < 0.5 ? -k:k);
            s.position.y += (max_y * Math.random()) * (Math.random() < 0.5 ? -k:k);
            //s.position.z += (max_z * 0.5 - max_z * Math.random()) * 0.005;
        }
    }
};
MODELS.Cloud.prototype = Object.create(THREE.Group.prototype);


MODELS.Terrain = function(width, height, segments_width, segments_height) {
    THREE.Group.call(this);
    var _scope = this;

    function generateGrid(geometry, sw, sh, x, z) {
        // Генерация первого ряда точек
        for (var i = 0; i <= segments_width; i++) {
            geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, z));
        }

        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var id_0 = 0;
        for (var j = 1; j <= segments_height; j++) {
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(x, 0, z + j * sh));
            // Генерация верхнего ряда точек
            for (var i = 1; i <= segments_width; i++) {
                geometry.vertices.push(new THREE.Vector3(x + (i * sw - sw / 2.0), 0, z + (j * sh - sh / 2.0)));
                geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, z + j * sh));

                // Вычисление индексов точек для поверхностей текущего сектора
                var id_1 = id_0 + ((j > 1) ? 2 : 1);
                var id_4 = geometry.vertices.length - 1;
                var id_3 = id_4 - 1;
                var id_2 = id_3 - 1;

                // Вычисление описание сектора
                geometry.faces.push(
                    new THREE.Face3(id_3, id_1, id_0),
                    new THREE.Face3(id_3, id_4, id_1),
                    new THREE.Face3(id_3, id_2, id_4),
                    new THREE.Face3(id_3, id_0, id_2));

                // Пересчёт индекса нижней левой точки сектора в ряду
                id_0 += (j > 1) ? 2 : 1;
            }
            // Пересчёт индекса нижней левой точки сектора в столбце
            id_0 += 1;
        }
    };

    var HILL_RADIUS_PERCENT = 0.1;
    var HILL_HEIGHT_PERCENT = 0.1;

    function generateHill(geometry, sw, sh, segments_width, segments_height) {
        // Выбор произвольного сегмента
        var segment_x = Math.floor(segments_width * Math.random() + 0.5);
        var segment_y = Math.floor(segments_height * Math.random() + 0.5);

        // Выбор полигона в сегменте
        var face_id = Math.floor(4 * Math.random());

        // Генерация высоты холма
        var height = 0.001;//Math.floor((sw * segments_width + sh * segments_height) * 0.5 * Math.random() * HILL_HEIGHT_PERCENT + 0.5);

        // Генерация радиуса холма
        var radius = Math.floor((sw * segments_width + sh * segments_height) * 0.5 * Math.random() * HILL_RADIUS_PERCENT + 0.5);
        var segments_radius_x = Math.ceil(radius / sw);
        var segments_radius_y = Math.ceil(radius / sh);
        console.log("[" + height + "," + radius+ "]");

        // Получить параметры зоны холма
        var segments_radius_begin_x = segment_x - segments_radius_x < 0 ? 0 : segment_x - segments_radius_x;
        var segments_radius_begin_y = segment_y - segments_radius_y < 0 ? 0 : segment_y - segments_radius_y;
        var segments_radius_end_x = segment_x + segments_radius_x > segments_width ? segments_width : segment_x + segments_radius_x;
        var segments_radius_end_y = segment_y + segments_radius_y > segments_height ? segments_height : segment_y + segments_radius_y;

        // Получение базовой точки холма
        var segments_face_id = segment_x*4 + face_id + segment_y*4*segments_width;
        //console.log("f[" + segment_x + "," + segment_y + "," + face_id + "]=" + segments_face_id);
        var faces = geometry.faces;
        var vertices = geometry.vertices;
        var fc = faces[segments_face_id];
        //console.log("f: {" + face.a + "," + face.b + "," + face.c + "}");
        var v0 = vertices[fc.a];
        //console.log("v0: {" + v0.x + "," + v0.z + "}");

        // Проход по сегментам в пределах радиуса и получение холма
        function hill(r, v0, v) {
            var y = Math.pow(r, 2) - (Math.pow((v.x - v0.x), 2) + Math.pow((v.z - v0.z), 2));
            if (y > 0) {
                if (v.y > 0) {
                    v.y = (v.y + y);
                } else {
                    v.y = y;
                }
            }
        }

        for (var y = segments_radius_begin_y; y < segments_radius_end_y; ++y) {
            for (var x = segments_radius_begin_x; x < segments_radius_end_x; ++x) {
                //console.log("f[" + x + "," + y + "]");
                for(var i = 0; i < 4; ++i) {
                    var face_id = x*4 + i + y*4*segments_width;
                    fc = faces[face_id];
                    hill(radius, v0, vertices[fc.a]);
                    hill(radius, v0, vertices[fc.b]);
                    hill(radius, v0, vertices[fc.c]);
                }
            }
        }
    }

    var sw = width/segments_width;
    var sh = height/segments_height;
    var x = -width/2.0;
    var z = -height/2.0;

    var _geometry = new THREE.Geometry();
    generateGrid(_geometry, sw, sh, x, z);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);
    generateHill(_geometry, sw, sh, segments_width, segments_height);

    _geometry.computeBoundingSphere();

    // Создание итоговой сетки и применение к ней материала
    //var _material = new THREE.MeshBasicMaterial({ color:0x00ff00 });
    var _material = new THREE.MeshBasicMaterial({ color:0x00ff00, wireframe: true, transparent: true });
    var _mesh = new THREE.Mesh(_geometry, _material);

    _scope.add(_mesh);
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
