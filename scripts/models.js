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

    function generateGrid(sw, sh, x, z) {
        var geometry = new THREE.Geometry();

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
        return geometry;
    };

    var HILL_RADIUS_PERCENT = 0.3;
    var HILL_HEIGHT_PERCENT = 0.3;

    function generateHill(faces, vertices, sw, sh) {
        // Генерация радиуса холма
        var radius = Math.min(sw*segments_width, sh*segments_height) * Math.random() * HILL_RADIUS_PERCENT;
        var segments_radius_w = Math.ceil(radius / sw);
        var segments_radius_h = Math.ceil(radius / sh);

        // Генерация высоты холма
        var height = Math.min(Math.min(sw*segments_width, sh*segments_height) * Math.random() * HILL_HEIGHT_PERCENT, radius);

        // Выбор произвольного сегмента
        var segment_x = Math.max(Math.floor(segments_width * Math.random() - 0.1), 0);
        var segment_y = Math.max(Math.floor(segments_height * Math.random() - 0.1), 0);

        // Получить параметры зоны холма
        var segments_radius_begin_x = Math.max(0, segment_x - segments_radius_w);
        var segments_radius_begin_y = Math.max(0, segment_y - segments_radius_h);
        var segments_radius_end_x = Math.min(segment_x + segments_radius_w + 1, segments_width);
        var segments_radius_end_y = Math.min(segment_y + segments_radius_h + 1, segments_height);

        // Получение точки вершины холма
        var segments_face_id = segment_x*4 + segment_y*4*segments_width;
        var top_face = faces[segments_face_id];
        var top = vertices[top_face.a];

        // Вычисление положения точки холма
        var divider = Math.sqrt(2*height*radius);
        function hill(v) {
            var y = height;
            var xsub = (top.x - v.x);
            var zsub = (top.z - v.z);
            var dividend = (xsub*xsub) + (zsub*zsub);
            if (dividend !== 0) {
                y = height - (dividend/divider);
            }
            if (y > 0) {
                v.y += y;
            }
        }

        // Обработка неполной диагонали точек сегмента
        function faceEdgePoints(face) {
            hill(vertices[face.a]);
            hill(vertices[face.c]);
        }

        // Обработка точек полигона в сегменте
        function segmentFacePoints(face) {
            hill(vertices[face.a]);
            hill(vertices[face.b]);
            hill(vertices[face.c]);
        }

        // Обработка диагонали точек сегмента
        function segmentDiagonalPoints(face_0, face_1) {
            hill(vertices[face_0.a]);
            hill(vertices[face_0.c]);
            hill(vertices[face_1.b]);
        }

        // Обработка первой точки холма
        hill(vertices[faces[segments_radius_begin_x*4 + segments_radius_begin_y*4*segments_width].a]);

        // Посегментный проход по первому ряду точек зоны холма, исключая первый сегмент
        for (var x = segments_radius_begin_x + 1; x < segments_radius_end_x; ++x) {
            faceEdgePoints(faces[x*4 + segments_radius_begin_y*4*segments_width]);
        }

        // Проход по центральным сегментам зоны холма
        for (var y = segments_radius_begin_y + 1; y < segments_radius_end_y - 1; ++y) {
            for (var x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
                faceEdgePoints(faces[x*4 + y*4*segments_width]);
            }
            segmentFacePoints(faces[x*4 + y*4*segments_width]);
        }

        // Посегментный проход по последнему ряду точек зоны холма, исключая последний сегмент
        for (var x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
            var face_id = x*4 + (segments_radius_end_y - 1)*4*segments_width;
            segmentDiagonalPoints(faces[face_id], faces[face_id + 1]);
        }
        segmentFacePoints(faces[x*4 + (segments_radius_end_y - 1)*4*segments_width]);
    }

    //var sw = width/segments_width;
    //var sh = height/segments_height;
    //var _geometry = generateGrid(sw, sh, -width/2.0, -height/2.0);
    //for (var i=0; i < 20; ++i) {
    //    generateHill(_geometry.faces, _geometry.vertices, sw, sh);
    //}
    //
    //_geometry.computeBoundingSphere();
    //
    //// Создание итоговой сетки и применение к ней материала
    ////var _material = new THREE.MeshBasicMaterial({ color:0x00ff00 });
    //var _material = new THREE.MeshBasicMaterial({ color:0x00ff00, wireframe: true, transparent: true });
    //var _mesh = new THREE.Mesh(_geometry, _material);
    //
    //_scope.add(_mesh);

    generateRoute(_geometry.faces, _geometry.vertices) {
        var geometry = new THREE.Geometry();


    }
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
