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

    var _animations = [];
    var _load_count = 0;

    // Загрузка байка
    loadModel("collada/bike_01.dae");
    // Загрузка рокетного двигателя
    loadModel("collada/mono_jet_01.dae");

    function loadModel(model_file) {
        var loader = new THREE.ColladaLoader();
        loader.load(model_file, function (collada) {
            console.log('model file: ' + model_file);
            var dae = collada.scene;
            dae.traverse(function(child) {
                if (child instanceof THREE.SkinnedMesh) {
                    _animations[_load_count] = new THREE.Animation(child, child.geometry.animation);
                    ++_load_count;
                    if (_load_count == 2) {
                        for(var animation in _animations) {
                            _animations[animation].play();
                        }
                        console.log("play animations");
                    }
                }
            });
            dae.updateMatrix();
            _scope.add(dae);
        });
    }

    this.update = function(dclock) {
        if (_alpha > 360) {
            _alpha = 0;
        }
        _scope.position.y += Math.sin(_alpha * (Math.PI / 180.0)) * FLOUTIN_DISTANCE_PERCENT;
        _alpha += dclock * 200;
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

    this.update = function() {
        for (var i = 0; i < _fractions.length; ++i) {
            var s = _fractions[i];
            var k = 0.001;
            s.position.x += (max_x * Math.random()) * (Math.random() < 0.5 ? -k:k);
            s.position.y += (max_y * Math.random()) * (Math.random() < 0.5 ? -k:k);
            //s.position.z += (max_z * 0.5 - max_z * Math.random()) * 0.005;
        }
    };
};
MODELS.Cloud.prototype = Object.create(THREE.Group.prototype);


MODELS.Terrain = function(width, height, segments_width, segments_height) {
    THREE.Group.call(this);
    var _scope = this;

    Grid = function (sw, sh, x, z, swidth, sheight) {
        var geometry = new THREE.Geometry();

        // Генерация первого ряда точек
        var i;
        for (i = 0; i <= swidth; i++) {
            geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, -z));
        }

        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var id_0 = 0;
        for (var j = 1; j <= sheight; j++) {
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(x, 0, -(z + j * sh)));
            // Генерация верхнего ряда точек
            for (i = 1; i <= swidth; i++) {
                geometry.vertices.push(new THREE.Vector3(x + (i * sw - sw / 2.0), 0, -(z + (j * sh - sh / 2.0))));
                geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, -(z + j * sh)));

                // Вычисление индексов точек для поверхностей текущего сектора
                var id_1 = id_0 + ((j > 1) ? 2 : 1);
                var id_4 = geometry.vertices.length - 1;
                var id_3 = id_4 - 1;
                var id_2 = id_3 - 1;

                // Вычисление описания сектора
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

    /** 
     * Генерация холмов в пределах сетки тирейна
     * faces,   - массив полигонов ландшафта
     * vertices - массив вершин ландшафта
     * sw,      - ширина сегмента
     * sh,      - длинна сегмента
     */
    function generateHill(faces, vertices, sw, sh) {
        var s_width = sw * segments_width;
        var s_height = sh * segments_height;

        // Генерация радиуса холма
        var radius = Math.min(s_width, s_height) * Math.random() * HILL_RADIUS_PERCENT;
        var segments_radius_w = Math.ceil(radius / sw);
        var segments_radius_h = Math.ceil(radius / sh);

        // Генерация высоты холма
        var height = Math.min(Math.min(s_width, s_height) * Math.random() * HILL_HEIGHT_PERCENT, radius);

        // Выбор произвольного сегмента
        var segment_x = Math.max(Math.floor(segments_width * Math.random() - 0.1), 0);
        var segment_y = Math.max(Math.floor(segments_height * Math.random() - 0.1), 0);
        function correct_pos(p, r, m) {
          var res = p;
          if ((p - r) < 0) {
            res = r;
          }
          if (m < (p + r)) {
            res = m -  r;
          }
          return res;
        }
        segment_x = correct_pos(segment_x, segments_radius_w, segments_width - 1);
        segment_y = correct_pos(segment_y, segments_radius_h, segments_height - 1);

        // Получить параметры зоны холма
        var segments_radius_begin_x = segment_x - segments_radius_w;
        var segments_radius_begin_y = segment_y - segments_radius_h;
        var segments_radius_end_x = segment_x + segments_radius_w;
        var segments_radius_end_y = segment_y + segments_radius_h;

        // Получение точки вершины холма
        var segments_face_id = segment_x * 4 + segment_y * 4 * segments_width;
        var top_face = faces[segments_face_id];
        var top = vertices[top_face.a];

        // Вычисление положения точки холма
        var divider = Math.sqrt(2 * height * radius);
        function hill(v) {
            var y = height;
            var dividend = Math.pow((top.x - v.x), 2) + Math.pow((top.z - v.z), 2);
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
        hill(vertices[faces[segments_radius_begin_x * 4 + segments_radius_begin_y * 4 * segments_width].a]);

        // Посегментный проход по первому ряду точек зоны холма, исключая первый сегмент
        var x;
        for (x = segments_radius_begin_x + 1; x < segments_radius_end_x; ++x) {
            faceEdgePoints(faces[x * 4 + segments_radius_begin_y * 4 * segments_width]);
        }

        // Проход по центральным сегментам зоны холма
        for (var y = segments_radius_begin_y + 1; y < segments_radius_end_y - 1; ++y) {
            for (x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
                faceEdgePoints(faces[x * 4 + y * 4 * segments_width]);
            }
            segmentFacePoints(faces[x * 4 + y * 4*segments_width]);
        }

        // Посегментный проход по последнему ряду точек зоны холма, исключая последний сегмент
        for (x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
            var face_id = x * 4 + (segments_radius_end_y - 1) * 4 * segments_width;
            segmentDiagonalPoints(faces[face_id], faces[face_id + 1]);
        }
        segmentFacePoints(faces[x * 4 + (segments_radius_end_y - 1) * 4 * segments_width]);
    }

    var fx = [
        0, -4, 6, -8, 4, 2
    ];

    var ROUTE_HEGHT_PERCENT = 0.6;

    /** 
     * Вычисление процента вертикальных подъемов от максимальной в пределах зоны, для ключевых точек горизонтальных изгибов трассы 
     * segments_w, - ширина ландшафта в сегментах
     * segments_h, - длинна ландшафта в сегментах
     * sw,         - ширина сегмента
     * sh,         - длинна сегмента
     * route_arr,  - массив горизонтальных координат кривой трассы
     * faces,      - массив полигонов ландшафта
     * vertices    - массив вершин ландшафта
     */
    function getSplinePivots(segments_w, segments_h,  sw, sh, route_arr, faces, vertices) {
        var res = [];
        var delta_average = segments_h / (route_arr.length - 1); // смещение определятся количеством отрезков, а не точек
        var aver_radius = delta_average * 0.25; // область для нахождения максимальной точки в радиусе 1/4 от длинны отрезка трассы

        for (var riter in  route_arr) {
            // Получить сегмент изгиба трассы
            var segm_x = Math.floor((route_arr[riter] / sw) + (segments_w * 0.5));
            var segm_y = Math.floor(riter * delta_average);

            // Получить параметры зоны точки изгиба трассы
            var segments_radius_begin_x = Math.max(0, segm_x - aver_radius);
            var segments_radius_begin_y = Math.max(0, segm_y - aver_radius);
            var segments_radius_end_x = Math.min(segm_x + aver_radius + 1, segments_w);
            var segments_radius_end_y = Math.min(segm_y + aver_radius + 1, segments_h);

            // Получение максимальной высоты для данной позиции
            var max = 0;
            for (var j = segments_radius_begin_y; j < segments_radius_end_y; ++j) {
                for (var i = segments_radius_begin_x; i < segments_radius_end_x; ++i) {
                    var face_id = i * 4 + j * 4 * segments_w;
                    var vert_id = faces[face_id].a;
                    max = Math.max(max, vertices[vert_id].y);
                }
            }
            // Получение координат ключевых точек трассы
            var x = (segm_x - (segments_w * 0.5)) * sw;
            var y = max * ROUTE_HEGHT_PERCENT;
            var z = -segm_y * sh;
            var v = { x:x, y:y, z:z };
            res[riter] = v;
            console.log(JSON.stringify(v));
        }
        return res;
    }

    /** 
     * Итератор по рядам точек 
     * start,   - стартовый идентификатор ряда точек сетки
     * fw,      - количесво сегментов сетки в ширину
     * fh,      - количесво сегментов сетки в длинну
     * faces,   - массив полигонов ландшафта
     * vertices - массив вершин ландшафта
     */
    VerticesRowsForwardIterator = function(start, fw, fh, faces, vertices) {
        var _cur_row = 0;
        if (start < fh * 2) {
            _cur_row = start;
        } else {
            _cur_row = fh * 2;
        }
        var _cur_fi = 0;

        this.inc = function() {
            var row = [];
            var irow = 0;
            var face;
            var i;
            if (!_cur_row) {
                // Получить 0 ряд точек
                for (irow = 0; irow < fw; ++irow) {
                    face = faces[irow * 4];
                    row[irow] = vertices[face.c];
                }
                row[irow] = vertices[face.b];
            } else if (_cur_row % 2) {
                // Получить не чётный ряд точек
                for (i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[i * 4];
                    row[irow++] = vertices[face.a];
                }
            } else {
                // Получить чётный ряд точек
                for (i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[(i * 4) + 2];
                    row[irow++] = vertices[face.b];
                }
                row[irow] = vertices[face.c];
                _cur_fi += fw;
            }
            ++_cur_row;
            return row;
        };

        this.curRow = function() {
            return _cur_row;
        };

        this.getRows = function() {
            return (fh * 2) + 1 - start;
        };
    };

    function computeControlPointsOfCurves(koords) {
        var p1 = [];
        var p2 = [];
        var n = koords.length - 1;
        // RHS вектор
        var a = [];
        var b = [];
        var c = [];
        var r = [];
        // Левый сегмент
        a[0] = 0;
        b[0] = 2;
        c[0] = 1;
        r[0] = koords[0] + 2 * koords[1];
        // Средние сегменты
        for (i = 1; i < n - 1; ++i) {
            a[i] = 1;
            b[i] = 4;
            c[i] = 1;
            r[i] = 4 * koords[i] + 2 * koords[i + 1];
        }
        // Правый сегмент
        a[n - 1] = 2;
        b[n - 1] = 7;
        c[n - 1] = 0;
        r[n - 1] = 8 * koords[n - 1] + koords[n];
        // Получить Ax=b по алгоритму Томаса
        for (i = 1; i < n; ++i) {
            m = a[i] / b[i - 1];
            b[i] = b[i] - m * c[i - 1];
            r[i] = r[i] - m * r[i - 1];
        }
        // Вычислить P1
        p1[n - 1] = r[n - 1] / b[n - 1];
        for (i = n - 2; i >= 0; --i) {
            p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];
        }
        // Вычислить P2
        for (i = 0; i < n - 1; ++i) {
            p2[i] = 2 * koords[i + 1] - p1[i + 1];
        }
        p2[n - 1] = 0.5 * (koords[n] + p1[n - 1]);
        var res = [];
        for (i = 0; i < n; ++i) {
            res[i] = { p0:koords[i], p1:p1[i], p2:p2[i], p3:koords[i + 1] };
        }
        return res;
    }

    function binom4(t, p0, p1, p2, p3) {
        var a = (1 - t);
        return a * a * a * p0 + 3 * a * a * t * p1 + 3 * a * t * t * p2 + t * t * t * p3;
    }

    /** 
     * Генерация трассы
     * pivots         - массив опорных точек изгиба трассы
     * width_rou      - ширина трассы
     * width_tir      - ширина тирейна
     * swidth_rou     - ширина трассы в сегментах
     * swidth_tir     - ширина тирейна в сегментах
     * sheight        - длинна трассы & тирейна в сегментах
     * tir_faces      - массив полигонов сетки тирейна
     * tir_vertices   - массив вершин сетки тирейна
     * route_faces    - массив полигонов сетки полотна трассы
     * route_vertices - массив вершин сетки полотна трассы
     */
    function setRoute(pivots, width_tir, width_rou, swidth_rou, swidth_tir, sheight, tir_faces, tir_vertices, route_faces, route_vertices) {
        // Проход по опорным точкам
        if (pivots.length > 2) {
            // Вычислить точки кривизны P1 и P2 для x координат опорных точек
            var i;
            var k1 = [];
            for (i = 0; i < pivots.length; ++i) {
                k1[i] = pivots[i].x;
            }
            var spt_x = computeControlPointsOfCurves(k1);
            // Вычислить точки кривизны P1 и P2 для y координат опорных точек
            var k2 = [];
            for (i = 0; i < pivots.length; ++i) {
                k2[i] = pivots[i].y;
            }
            var spt_y = computeControlPointsOfCurves(k2);
            // Итератор по рядам сетки полотна трассы
            var vrfi_rou = new VerticesRowsForwardIterator(0, swidth_rou, sheight, route_faces, route_vertices);
            // Итератор по рядам сетки тирейна
            var vrfi_tir = new VerticesRowsForwardIterator(0, swidth_tir, sheight, tir_faces, tir_vertices);
            // Получить дробное количество точек трассы в пределах отрезка опорных точек
            var hshift = vrfi_rou.getRows() / (pivots.length - 1); // смещение определятся количеством отрезков, а не количеством точек;
            var beg_pos = 0;
            var row_rou;
            var row_tir;
            var left_rou_x = - (width_rou * 0.5);
            var rsift_tir = (width_tir * 0.5);
            var sw_rou = width_rou / swidth_rou; // Ширина сегмента трассы
            var sw_tir = width_tir / swidth_tir; // Ширина сегмента тирейна
            for (i = 0; i < pivots.length - 1; ++i) {
                var ra = pivots[i];     // стартовая точка отрезка кривой
                var rb = pivots[i + 1]; // завершающая точка отрезка кривой
                // Обработка точек трассы в пределах опорного отрезка
                var end_pos = Math.floor(hshift * (i + 1));
                // Проход по рядам в пределах отрезка
                var count = end_pos - beg_pos;
                for (var j = 0; j < count; ++j) {
                    // Вычислить кривизну для x координаты точек трассы
                    var b4_x = binom4(j / count, spt_x[i].p0, spt_x[i].p1, spt_x[i].p2, spt_x[i].p3);
                    // Вычислить кривизну для y координаты точек трассы
                    var b4_y = binom4(j / count, spt_y[i].p0, spt_y[i].p1, spt_y[i].p2, spt_y[i].p3);
                    row_rou = vrfi_rou.inc();
                    var is_even = (row_rou.length % 2) === 0; // Чётный ряд всегда содержит центральные точки сегментов
                    var lrx = left_rou_x; // отсчёт координат с левой стороны трассы
                    var stx;
                    if (is_even) {
                        lrx += (sw_rou * 0.5); // смещение к центру трассы до центральной точки сегмента
                        stx = Math.floor(((b4_x + lrx + rsift_tir) / sw_tir) + (sw_tir * 0.5)); // Для центральных точек необходима коррекция до края сегмента влево
                    } else {
                        stx = Math.floor((b4_x + lrx + rsift_tir) / sw_tir); // Определить id точки из ряда точек тирейна
                    }
                    if (stx < 0) {
                        stx = 0;
                    }
                    row_tir = vrfi_tir.inc();
                    // Вычисление значений x по ширине трассы
                    for (var v = 0; v < row_rou.length; ++v) {
                        row_rou[v].x = b4_x + lrx;
                        lrx += sw_rou;
                        row_rou[v].y = b4_y;
                        // Подтягивание ландшафта к полотну трассы 
                        if (stx < row_tir.length) {
                            row_tir[stx++].y = b4_y;
                        }
                    }
                    // Коррекция тирейна под полотно трассы
                }
                beg_pos = end_pos;
            }
        } else {
            console.log('ERR: Опорных точек должно быть больше 2');
        }
    }

    var sw = width / segments_width;
    var sh = height / segments_height;
    var _terrain_geometry = new Grid(sw, sh, -width * 0.5, -height * 0.5, segments_width, segments_height);
    for (var i = 0; i < 80; ++i) {
        generateHill(_terrain_geometry.faces, _terrain_geometry.vertices, sw, sh);
    }
    //_terrain_geometry.computeBoundingSphere();

    var spline_pivots = getSplinePivots(segments_width, segments_height, sw, sh, fx,
                                        _terrain_geometry.faces, _terrain_geometry.vertices);

    // Тестовые объекты
    var darkMaterial = new THREE.MeshBasicMaterial( { color: 0x7777cc } );
    var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true, transparent: true } );
    var multiMaterial = [ darkMaterial, wireframeMaterial ];
    for(var sp in spline_pivots) {
        var octagedron = new THREE.OctahedronGeometry(1, 0);
        var shape = THREE.SceneUtils.createMultiMaterialObject(octagedron, multiMaterial);
        var pos = spline_pivots[sp];
        shape.position.set(pos.x, pos.y, pos.z + height * 0.5);
        _scope.add(shape);
    }

    var tir_sh = segments_width; // Число сегментов тирейна в ширину.
    var route_w = 4; // Ширина трассы
    var route_h = height; // Длинна проекции трассы
    var route_sw = route_w * sw; // Число сегментов трассы в ширину
    var route_sh = segments_height; // Число сегментов трассы в длинну.
    var _route_geometry = new Grid(route_w / route_sw, route_h / route_sh, -route_w * 0.5, -route_h * 0.5, route_sw, route_sh);
    setRoute(spline_pivots, width, route_w, route_sw, tir_sh, segments_height,
             _terrain_geometry.faces, _terrain_geometry.vertices,
             _route_geometry.faces, _route_geometry.vertices);

    //smootheRoute(_terrain_geometry.faces, _terrain_geometry.vertices, sw, sh,
    //             _route_geometry.faces, _route_geometry.vertices, route_sw, route_sh);

    // Создание итоговой сетки и применение к ней материала
    ////var _material = new THREE.MeshBasicMaterial({ color:0x00ff00 });
    var _mat_tir = new THREE.MeshBasicMaterial({ color:0x00ff00, wireframe: true, transparent: true });
    var _mesh_tir = new THREE.Mesh(_terrain_geometry, _mat_tir);
    _scope.add(_mesh_tir);

    var _mat_route = new THREE.MeshBasicMaterial({ color:0x0000ff, wireframe: true, transparent: true });
    var _mesh_route = new THREE.Mesh(_route_geometry, _mat_route);
    _scope.add(_mesh_route);
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
