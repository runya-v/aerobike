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


/** 
 * Генератор трассы
 * width           - Ширина холмистого ландшафта
 * height          - Длинна холмистого ландшафта 
 * segments_width  - Ширина сегмента сетки поверхности
 * segments_height - длинна сегмента сетки поверхности
 */
MODELS.Terrain = function(conf) {
    THREE.Group.call(this);
    var _scope = this;

    var HILL_RADIUS_PERCENT = 0.15;  ///< Процент от ширины ландшафта для вычисления радиуса холма
    var HILL_HEIGHT_PERCENT = 0.5;   ///< Процент от ширины ландшафта для вычисления высоты холма
    var NULL_ZONE_PERCENT = 2;       ///< Коэфициент для зоны отчуждения на краю ландшафта на основе вычесленного радиуса
    var NUM_HILLS = 350;             ///< Количество генерируемых холмов
    var ROUTE_HEGHT_PERCENT = 0.6;   ///< Процент от средней высоты в зоне ландшафта под опорной точкой перегиба трассы
    var MIN_ROUTE_PIVOUT_COUNT = 5;  ///< Минимальное число поворотов трассы
    var MAX_ROUTE_PIVOUT_COUNT = 20; ///< Максимальное число поворотов трассы

    /*
     *  segment_w       - Ширина сегмента: width / segments_width, 
     *  segment_h       - Длинна сегмента: height / segments_height, 
     *  pos_x           - Смещение в начало координат: -width * 0.5, 
     *  pos_z           - Смещение в начало координат: -height * 0.5, 
     *  segments_width  - Ширина в сегментах: segments_width, 
     *  segments_height - Длинна в сегментах: segments_height
     */
    Grid = function(conf) {
        var geometry = new THREE.Geometry();
        // Генерация первого ряда точек
        var i;
        for (i = 0; i <= swidth; i++) {
            geometry.vertices.push(new THREE.Vector3(conf.pos_x + i * conf.segment_w, 0, -conf.pos_z));
        }
        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var id_0 = 0;
        for (var j = 1; j <= sheight; j++) {
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(conf.pos_x, 0, -(conf.pos_z + j * conf.segment_h)));
            // Генерация верхнего ряда точек
            for (i = 1; i <= swidth; i++) {
                var vec = {
                    x: conf.pos_x + (i * conf.segment_w - conf.segment_w * 0.5),
                    z: -(conf.pos_z + (j * conf.segment_h - conf.segment_h * 0.5))
                };
                geometry.vertices.push(new THREE.Vector3(vec.x, 0, vec.z));
                vec.x = conf.pos_x + i * conf.segment_w;
                vec.z = -(conf.pos_z + j * conf.segment_h);
                geometry.vertices.push(new THREE.Vector3(vec.x, 0, vec.z));
                // Вычисление индексов точек для поверхностей текущего сектора
                var id_1 = id_0 + ((j > 1) ? 2 : 1);
                var id_4 = geometry.vertices.length - 1;
                var id_3 = id_4 - 1;
                var id_2 = id_3 - 1;
                // Вычисление описания сектора
                geometry.faces.push(
                    new THREE.Face3(id_3, id_0, id_1),  // face[a, b, c]
                    new THREE.Face3(id_3, id_1, id_4),  // face[a, b, c]
                    new THREE.Face3(id_3, id_4, id_2),  // face[a, b, c]
                    new THREE.Face3(id_3, id_2, id_0)); // face[a, b, c]

                // Пересчёт индекса нижней левой точки сектора в ряду
                id_0 += (j > 1) ? 2 : 1;
            }
            // Пересчёт индекса нижней левой точки сектора в столбце
            id_0 += 1;
        }
        return geometry;
    };

    /*
     * hills - Необходимое число холмов
     * width - Ширина в сегментах
     * heigh - Длинна в сегментах
     */
    HegthMap = function(conf) {
        // Создать посегментную карту высот
        var d = [];
        var i;
        for (i = 0; i < conf.width * conf.height; ++i) {
            d[i] = 0;
        }
        // Генерация холмов в пределах сетки тирейна
        function hill() {
            // Генерация радиуса холма
            var rw = Math.ceil(Math.min(conf.width, conf.height) * Math.random() * HILL_RADIUS_PERCENT); // Радиус в сегментах по ширине
            var rh = Math.ceil(Math.min(conf.width, conf.height) * Math.random() * HILL_RADIUS_PERCENT); // Радиус в сегментах по длинне
            // Генерация высоты холма
            var r = (rw + rh) * 0.5;
            var h = Math.min(Math.min(conf.width, conf.height) * Math.random() * HILL_HEIGHT_PERCENT, r);
            // Выбор произвольного сегмента в пределах тирейна
            var nz_w = rw * NULL_ZONE_PERCENT;
            var nz_h = rh * NULL_ZONE_PERCENT;
            var x = Math.max(Math.floor((conf.width - nz_w) * Math.random() - 0.1), nz_w);
            var z = Math.max(Math.floor((conf.height - nz_h) * Math.random() - 0.1), nz_h);
            // Получить параметры зоны холма
            var beg_x = x - rw;
            var beg_z = z - rh;
            var end_x = x + rw;
            var end_z = z + rh;
            // Получить точку вершины холма
            var top = {
                x: (beg_x + end_x) * 0.5,
                y: 0,
                z: (beg_z + end_z) * 0.5
            };
            // Вычисление положения точки холма
            var divider = Math.sqrt(2 * h * r);
            function getHillHeight(v) {
                var y = h;
                var dividend = Math.pow((top.x - v.x), 2) + Math.pow((top.z - v.z), 2);
                if (dividend !== 0) {
                    y = h - (dividend/divider);
                }
                if (0 < y) {
                    y += v.y;
                }
                return y;
            }
            for (i = beg_x; i < end_x; ++i) {
                for (j = beg_z; j < end_z; ++j) {
                    var pos = i + j * (end_x - beg_x);
                    var v = {
                        x: i,
                        y: d[pos],
                        z: j
                    };
                    d[pos] = getHillHeight(v);
                }
            }
        }
        // Сгенерировать множество холмов
        for (i = 0; i < hills; ++i) {
            hill();
        }
        return d;
    };
    
    /** 
     * Вычисление точек для направляющих векторов лежащих на касательной к кривой в заданной точке 
     * koords - Длинна сегмента
     */
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
            res[i] = { 
                p0:koords[i], 
                p1:p1[i], 
                p2:p2[i], 
                p3:koords[i + 1] 
            };
        }
        return res;
    }

    /** 
     * Вычисление значения координаты для 4 для 4- х точек, описывающих отрезок кривой 
     * t      - Прочент от общего отрезка кривой
     * p0     - Координата начала отрезка кривой
     * p1, p2 - Координаты, задающие изгиб кривой
     * p3     - Координата конца отрезкакривой
     */
    function binom4(conf) {
        var a   = (1 - conf.t);
        var at3 = a * conf.t * 3;
        return conf.p0 * a      * a      * a + 
               conf.p1 * at3    * a + 
               conf.p2 * at3    * conf.t + 
               conf.p3 * conf.t * conf.t * conf.t;
    }

    /** 
     * Генерация точек перегиба в горизонтальной плоскости
     * width      - ширина ландшафта
     * min_points - минимальное число изгобов
     * max_points - максимальное число изгобов
     */
    function generatePivoutPoints(conf) {
        var fx = [];
        // Получить произвольное значение из [min_points; max_points]
        var count = Math.floor((conf.max_points - conf.min_points) * Math.random() + 0.5) + conf.min_points;
        fx[0] = 0; ///< Первая точка всегда в центре
        // Получить значения перегибов в пределах ширины тирейна
        for (var i = 1; i < count; ++i) {
            fx[i] = Math.floor(conf.width * Math.random() + 0.5) - conf.width * 0.5;
        }
        fx[count] = 0; ///< Последняя точка всегда в центре
        return fx;      
    }

// TODO

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

        for (var riter in route_arr) {
            // Получить сегмент изгиба трассы
            var segm_x = Math.floor((route_arr[riter] / sw) + (segments_w * 0.5));
            var segm_y = Math.floor(riter * delta_average);

            // Получить параметры зоны точки изгиба трассы
            var segments_radius_begin_x = Math.floor(Math.max(1, segm_x - aver_radius));
            var segments_radius_begin_y = Math.floor(Math.max(1, segm_y - aver_radius));
            var segments_radius_end_x = Math.floor(Math.min(segm_x + aver_radius, segments_w - 1));
            var segments_radius_end_y = Math.floor(Math.min(segm_y + aver_radius, segments_h - 1));

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
        // Первая и последние точки должны быть на нулевой высоте
        res[0].y = 0;
        res[route_arr.length - 1].y = 0;
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
                    row[irow] = vertices[face.b];
                }
                row[irow] = vertices[face.c];
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
                    row[irow++] = vertices[face.c];
                }
                row[irow] = vertices[face.b];
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

    /** 
     * Генерация обочин трассы для поперчного ряда точек тирейна
     * is_even_row - флаг чётного ряда точек
     * sw          - ширина сегмента
     * rou_point   - центральная точка трассы на редактируемом ряду
     * rou_width   - ширина трассы
     * tir_width   - ширина тирейна
     * row_rou     - массив ряда точек трассы
     * row_tir     - массив ряда точек тирейна
     */
    function verges(is_even_row, sw, rou_point, rou_width, tir_width, row_rou, row_tir) {
        // Получение опорных точек кривой для обочин трассы
        var half_rou_width = rou_width * 0.5;
        var x = [];
        x[0] = rou_point - rou_width * 2;
        x[1] = rou_point - half_rou_width;
        x[2] = rou_point + half_rou_width;
        x[3] = rou_point + rou_width * 2;
        // Вычислить id стартовой и коенчной точек в ряду точек тирейна
        var beg_id; // Идентификатор первой точки левой обочины
        var end_id; // Идентификатор последней точки правой обочины
        var rou_beg_id; // Идентификатор первой точки левого края трассы
        var rou_end_id; // Идентификатор последней точки правого края трассы
        var centred_beg_x = x[0] + tir_width * 0.5; // Смещение левого края левой обочины в центр координат
        var centred_rou_beg_x = x[1] + tir_width * 0.5; // Смещение левого края левой стороны трассы в центр координат
        var oaahalf_rou_w = rou_width * 4; // 2 ширины трассы (one and a half)
        if (is_even_row) { // Четный ряд точек относится к точкам в центре сегментов сетки
            beg_id = Math.floor(centred_beg_x / sw); 
            rou_beg_id = Math.floor(centred_rou_beg_x / sw);
            rou_end_id = Math.floor((centred_rou_beg_x + rou_width) / sw);
            end_id = Math.floor((centred_beg_x + oaahalf_rou_w) / sw);
        } else {
            var half_sw = sw * 0.5; // Половина ширины сегмента
            var cbx_s_hsw = centred_beg_x + half_sw; // Смещение до крайнего ребра левой обочины для координат центров сегментов сетки
            var crbx_s_hsw = centred_rou_beg_x + half_sw; // Смещение до крайнего ребра левого края трассы для координат центров сегментов сетки
            beg_id = Math.floor(cbx_s_hsw / sw); 
            rou_beg_id = Math.floor(crbx_s_hsw / sw);
            rou_end_id = Math.floor((crbx_s_hsw + rou_width) / sw);
            end_id = Math.floor((cbx_s_hsw + oaahalf_rou_w) / sw);
        }
        // Корректировка индексов, во избежании выхода за разумные минимальные подмножества обрабатываемых точек
        if (beg_id < 0) {
            beg_id = 0;
        }
        if (rou_beg_id < beg_id) {
            rou_beg_id = beg_id;
        }
        if (row_tir.length <= rou_end_id) {
            rou_end_id = row_tir.length - 1;
        }
        if (row_tir.length <= end_id) {
            end_id = row_tir.length - 1;
        }
        if (beg_id + 3 < end_id) { // Минимальное количество обрабатываемых точек 4
            // Вычислить точки кривизны P1 и P2 для 'y' координат опорных точек
            var y = [];
            y[0] = row_tir[beg_id].y;
            y[1] = row_rou[0].y;
            y[2] = row_rou[row_rou.length - 1].y;
            y[3] = row_tir[end_id].y;
            var spt = computeControlPointsOfCurves(y); // Полученный набор опорных точек применим только к обочинам
            var yc = [];
            yc[0] = y[1];
            yc[1] = y[2];
            if (spt.length === y.length - 1) { // Количество описателей отрезков кривых должно соответствовать количеству отрезков
                // Построить кривую обочины слева от трассы
                var j;
                var b4_y;
                var i = beg_id;
                var count  =  rou_beg_id - beg_id;
                for (j = 0; j <= count; ++j) {
                    b4_y = binom4(j / count, spt[0].p0, spt[0].p1, spt[0].p2, spt[0].p3);
                    row_tir[i++].y = b4_y;
                }
                // Построить "прямую" под полотном трассы
                i = rou_beg_id;
                count  =  rou_end_id - rou_beg_id;
                var sub = y[2] - y[1];
                var k =  sub / row_rou.length;
                for (j = 0; j <= count; ++j) {
                    row_tir[i++].y = (y[1] + (count - j) * k) - 0.1;
                }
                // Построить кривую обочины справа от трассы
                i = rou_end_id;
                count  =  end_id - rou_end_id;
                for (j = 0; j <= count; ++j) {
                    b4_y = binom4(j / count, spt[2].p0, spt[2].p1, spt[2].p2, spt[2].p3);
                    row_tir[i++].y = b4_y;
                }
                console.log(JSON.stringify(row_tir));
            }
        }
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
            // Вычислить точки кривизны P1 и P2 для 'x' координат опорных точек
            var i;
            var k1 = [];
            for (i = 0; i < pivots.length; ++i) {
                k1[i] = pivots[i].x;
            }
            var spt_x = computeControlPointsOfCurves(k1);
            // Вычислить точки кривизны P1 и P2 для 'y' координат опорных точек
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
                    var is_even = (row_rou.length % 2) === 0; // Чётное количество точек ряда для трассы всегда содержит центральные точки сегментов
                    var lrx = left_rou_x; // отсчёт координат с левой стороны трассы
                    if (is_even) {
                        lrx += (sw_rou * 0.5); // смещение к центру трассы до центральной точки сегмента
                    }
                    row_tir = vrfi_tir.inc();
                    // Вычисление значений x по ширине трассы
                    for (var v = 0; v < row_rou.length; ++v) {
                        row_rou[v].x = b4_x + lrx;
                        lrx += sw_rou;
                        row_rou[v].y = b4_y;
                    }
                    // Коррекция тирейна под полотно трассы - построение кривых обочин
                    verges(is_even, sw_tir, b4_x, width_rou, width_tir, row_rou, row_tir);
                }
                beg_pos = end_pos;
            }
        } else {
            console.log('ERR: Опорных точек должно быть больше 2');
        }
    }

    // Построение игрового пространства
    
    var grid_conf = {
        segment_w: conf.width / conf.segments_width, 
        segment_h: conf.height / conf.segments_height, 
        pos_x: -conf.width * 0.5, 
        pos_z: -conf.height * 0.5, 
        segments_width: conf.segments_width, 
        segments_height: conf.segments_height
    };
    var _terrain_geometry = new Grid(grid_conf);
    var hm_conf = {
        hills: NUM_HILLS,
        width: conf.segments_width,
        height: conf.segments_height
    };
    var _height_map = new HegthMap(hm_conf);
    var rp_conf = {
        width: conf.width,
        min_points: MIN_ROUTE_PIVOUT_COUNT,
        max_points: MAX_ROUTE_PIVOUT_COUNT
    };
    var _rute_pivots = new Pivots();
    var route_conf = {
        height_map: _height_map,
        width: conf.segments_width,
        height: conf.segments_height,
        rute_pivots: _rute_pivots
    };
    generateRoute(route_conf);
    
    // for (var i = 0; i < NUM_HILLS; ++i) {
    //     generateHill(_terrain_geometry.faces, _terrain_geometry.vertices, sw, sh);
    // }

    // var fx = generatePivoutPoints(46, 7, 14);
    // var spline_pivots = getSplinePivots(segments_width, segments_height, sw, sh, fx,
    //                                     _terrain_geometry.faces, _terrain_geometry.vertices);

    // var tir_sh = segments_width; // Число сегментов тирейна в ширину.
    // var route_w = 4; // Ширина трассы
    // var route_h = height; // Длинна проекции трассы
    // var route_sw = route_w * sw; // Число сегментов трассы в ширину
    // var route_sh = segments_height; // Число сегментов трассы в длинну.
    // var _route_geometry = new Grid(route_w / route_sw, route_h / route_sh, -route_w * 0.5, -route_h * 0.5, route_sw, route_sh);
    // setRoute(spline_pivots, width, route_w, route_sw, tir_sh, segments_height,
    //         _terrain_geometry.faces, _terrain_geometry.vertices,
    //         _route_geometry.faces, _route_geometry.vertices);

    // // Создание итоговой сетки и применение к ней материала
    // var tir_texture = new THREE.ImageUtils.loadTexture('images/tir_39.jpg');
    // tir_texture.wrapS = THREE.RepeatWrapping;
    // tir_texture.wrapT = THREE.RepeatWrapping;
    // tir_texture.repeat.set(2, 2);
    // var tir_bump = new THREE.ImageUtils.loadTexture('images/bumpmap.jpg');
    // var _mat_tir = new THREE.MeshPhongMaterial({ 
    //     map:tir_texture,
    //     mapScale:10,
    //     bumpMap:tir_bump,
  	 //   bumpScale:10
    // });
    // _terrain_geometry.computeFaceNormals();
    // _terrain_geometry..computeVertexNormals();
    // _terrain_geometry..computeTangents();
    // var _mesh_tir = new THREE.Mesh(_terrain_geometry, _mat_tir);
    // _mesh_tir.receiveShadow  = true;
    // _scope.add(_mesh_tir);

    // var _mat_route = new THREE.MeshBasicMaterial({ color:0x0000ffaa, transparent: true });
    // _route_geometry.computeFaceNormals();
    // var _mesh_route = new THREE.Mesh(_route_geometry, _mat_route);
    // _scope.add(_mesh_route);
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
