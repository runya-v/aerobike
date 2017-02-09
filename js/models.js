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
    var NULL_ZONE_PERCENT = 0.5;     ///< Коэфициент для зоны отчуждения на краю ландшафта на основе вычесленного радиуса
    var NUM_HILLS = 50;             ///< Количество генерируемых холмов
    var ROUTE_HEGHT_PERCENT = 0.6;   ///< Процент от средней высоты в зоне ландшафта под опорной точкой перегиба трассы
    var MIN_ROUTE_PIVOUT_COUNT = 5;  ///< Минимальное число поворотов трассы
    var MAX_ROUTE_PIVOUT_COUNT = 20; ///< Максимальное число поворотов трассы

    /**
     * Генерация карты высот
     * hills - Необходимое число холмов
     * width - Ширина в сегментах
     * heigh - Длинна в сегментах
     */
    HegthMap = function(conf) {
        // Создать посегментную карту высот
        var d = [];
        var i;
        for (i = 0; i < conf.segm_width * conf.segm_height; ++i) {
            d[i] = 0;
        }
        // Генерация холмов в пределах сетки тирейна
        function hill() {
            // Генерация радиуса холма
            var min = Math.min(conf.segm_width - 1, conf.segm_height - 1);
            var rw = Math.ceil(min * HILL_RADIUS_PERCENT * Math.random()); // Радиус в сегментах по ширине
            var rh = Math.ceil(min * HILL_RADIUS_PERCENT * Math.random()); // Радиус в сегментах по длинне
            // Генерация высоты холма
            var r = (rw + rh) * 0.5;
            var h = Math.min(min * HILL_HEIGHT_PERCENT * Math.random(), r);
            // Выбор произвольного сегмента в пределах тирейна
            var dnz = (r + 1) * 2;
            var x = Math.floor((conf.segm_width - dnz) * Math.random() + r + 1);
            var z = Math.floor((conf.segm_height - dnz) * Math.random() + r + 1);
            // Точку вершины холма
            var top = { x: x, y: 0, z: z };
            // Вычисление положения точки холма
            var divider = Math.sqrt(2 * h * r);
            function getHillHeight(v) {
                var y = h;
                var dividend = Math.pow((top.x - v.x), 2) + Math.pow((top.z - v.z), 2);
                if (dividend !== 0) {
                    y = h - (dividend/divider);
                }
                if (y < 0) {
                    y = 0;
                }
                return (v.y + y);
            }
            // Получить параметры зоны холма
            var beg_x = Math.floor(x - rw);
            var beg_z = Math.floor(z - rh);
            var end_x = Math.floor(x + rw);
            var end_z = Math.floor(z + rh);
            for (j = beg_z; j < end_z; ++j) {
                for (i = beg_x; i < end_x; ++i) {
                    var pos = j * conf.segm_width + i;
                    var v = {
                        x: i,
                        y: d[pos],
                        z: j
                    };
                    d[pos] = getHillHeight(v);
                }
            }
            console.log(r + ',\t|' + x + ', ' + z + '| ' + dnz);
        }
        // Сгенерировать множество холмов
        for (var hs = 0; hs < 10; ++hs) {// conf.hills; ++hs) {
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
     * width       - ширина ландшафта
     * route_width - ширина трассы
     * min_points  - минимальное число изгобов
     * max_points  - максимальное число изгобов
     */
    function generatePivoutPoints(conf) {
        var fx = [];
        // Получить произвольное значение из [min_points; max_points]
        var count = Math.floor((conf.max_points - conf.min_points) * Math.random() + 0.5) + conf.min_points;
        fx[0] = 0; ///< Первая точка всегда в центре
        // Получить значения перегибов в пределах ширины тирейна
        var w = conf.width - conf.route_width;
        for (var i = 1; i < count; ++i) {
            fx[i] = (w * Math.random()) - (w * 0.5);
        }
        fx[count] = 0; ///< Последняя точка всегда в центре
        return fx;
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
     * Вычисление процента вертикальных подъемов от максимальной в пределах зоны, для ключевых точек горизонтальных изгибов трассы 
     * height_map    - Карта высот тирейна,
     * route_width   - Ширина трассы,
     * width         - Ширина тирейна,
     * height        - Длинна тирейна,
     * route_pivots  - Массив опорных точек трассы
     */
    function getSplinePivots(conf) {
        var res = [];
        var delta_average = conf.height / (conf.route_pivots.length - 1); // смещение определятся количеством отрезков, а не точек
        var aver_radius = delta_average * 0.25; // область для нахождения максимальной точки в радиусе 1/4 от длинны отрезка трассы
        // Проход по X - составляющим опорных точек
        var w = (conf.width - conf.route_width * 0.5);
        for (var riter = 0; riter < conf.route_pivots.length; ++riter) {
            // Получить координату точки трассы наиболее близкую к опорной
            var mx = Math.floor(conf.route_pivots[riter] + w);
            var my = Math.floor(riter * delta_average);
            // Получить параметры зоны точки изгиба трассы
            var rbeg_x = Math.max(0, Math.floor(mx - aver_radius));
            var rbeg_y = Math.max(0, Math.floor(my - aver_radius));
            var rend_x = Math.min(Math.floor(mx + aver_radius), conf.width);
            var rend_y = Math.min(Math.floor(my + aver_radius), conf.height);
            // Получение максимальной высоты для данной позиции
            var max = 0;
            for (var j = rbeg_y; j < rend_y; ++j) {
                for (var i = rbeg_x; i < rend_x; ++i) {
                    var map_id = i + j * conf.width;
                    max = Math.max(max, conf.height_map[map_id]);
                }
            }
            // Получение координат ключевых точек трассы
            var vertex = {
                x: mx - w,
                y: max * ROUTE_HEGHT_PERCENT,
                z: -my
            };
            res[riter] = vertex;
            //console.log(JSON.stringify(vertex));
        }
        // Первая и последние точки должны быть на нулевой высоте
        res[0].y = 0;
        res[conf.route_pivots.length - 1].y = 0;
        return res;
    }

    /**
     * Получение кривой обочин трассы
     * height_map  - Карта высот тирейна,
     * tir_width   - Ширина трассы
     * segment_w   - Ширина сегмента
     * route_width - Ширины трассы
     * route_centr - Центральная точка трассы на ряду точек тирейна
     * tir_ids_row     - Ряд точек тирейна
     */
    function generateVerges(conf) {
        var beg_tir_x = conf.height_map[conf.tir_ids_row[0]].x; // Левая координата тирейна
        var end_tir_x = conf.height_map[conf.tir_ids_row[conf.tir_ids_row.length - 1]].x; // Правая координата тирейна
        // Трасса с обочинами должна находиться в пределах тирейна
        if (beg_tir_x <= (conf.route_centr - conf.route_width) && (conf.route_centr + conf.route_width) <= end_tir_x) {
            // Получение индексов поперечного сечения трассы
            var half_tir_width = conf.tir_width * 0.5;
            var half_route_width = conf.route_width * 0.5;
            var beg = Math.floor((conf.route_centr.x - conf.route_width + half_tir_width) / conf.segment_w + 0.5);
            var beg_rou = Math.floor((conf.route_centr.x - half_route_width + half_tir_width) / conf.segment_w + 0.5);
            var end_rou = Math.floor((conf.route_centr.x + half_route_width + half_tir_width) / conf.segment_w + 0.5);
            var end = Math.floor((conf.route_centr.x + conf.route_width + half_tir_width) / conf.segment_w + 0.5);
            // Получение векторов касательных к крайним точкам сегментов
            var koords = [];
            koords[0] = tir_row[beg].y;
            koords[1] = conf.route_centr.y;
            koords[2] = conf.route_centr.y;
            koords[3] = tir_row[end].y;
            var cpc = computeControlPointsOfCurves(koords);
            // Получение лекой обочины
            var i;
            var binom_conf = {};
            var t_div = 1 / (beg_rou - beg);
            for (i = beg; i < beg_rou; ++i) {
                binom_conf = {
                    t: t_div * i,
                    p0: cpc[0].p0,
                    p1: cpc[0].p1,
                    p2: cpc[0].p2,
                    p3: cpc[0].p3
                };
                conf.height_map[tir_ids_row[i]].y = binom4(binom_conf);
            }
            // Получение правой обочины
            t_div = 1 / (end - end_rou);
            for (i = end; i < end_rou; ++i) {
                binom_conf = {
                    t: t_div * i,
                    p0: cpc[2].p0,
                    p1: cpc[2].p1,
                    p2: cpc[2].p2,
                    p3: cpc[2].p3
                };
                conf.height_map[tir_ids_row[i]].y = binom4(binom_conf);
            }
        }
    }

    /**
     * Генерация трассы
     * height_map   - Карта высот тирейна,
     * segm_width   - Ширина тирейна,
     * segm_height  - Длинна тирейна,
     * route_pivots - Массив опорных точек трассы,
     * segment_w    - Ширина сегмента,
     * segment_h    - Длинна сегмента,
     * route_pivots - Опорные точки трассы,
     * route_width  - Ширина трассы,
     */
    function generateRoute(conf) {
        // Получить оптимизированные вершины для опорных точек трассы
        var spiv_conf = {
            height_map:   conf.height_map,
            route_width:  conf.route_width,
            width:        conf.segm_width * conf.segment_w,
            height:       conf.segm_height * conf.segment_h,
            route_pivots: conf.route_pivots
        };
        var pivot_verts = getSplinePivots(spiv_conf);

        // Послучить комплект горизонтальной кривизны трассы
        var i;
        var x_koords = [];
        var y_koords = [];
        for (i = 0; i < pivot_verts.length; ++i) {
            x_koords.push(pivot_verts[i].x);
            y_koords.push(pivot_verts[i].y);
        }
        var x_cpc = computeControlPointsOfCurves(x_koords);

        // Послучить комплект вертикальной кривизны трассы
        var y_cpc = computeControlPointsOfCurves(y_koords);

        // Построение кривой трассы
        var route = [];
        var sp_count = conf.segm_height + 1 / x_cpc.length; // Число точек трассы в карте высот
        var count_coef = 1 / conf.segm_height; // Поточечный корректирующий коэефициент смещения индексов
        var beg = 0;
        for (var s = 0; s < x_cpc.length; ++s) {
            // Построение сегмента
            var x_scpc = x_cpc[s];
            var y_scpc = y_cpc[s];
            var end = Math.floor((s + 1) * sp_count - count_coef + 0.5);
            var t_coef = 1 / (end - beg);
            for (i = beg; i < end; ++i) {
                var t = t_coef * i;
                var x_binom_conf = {
                    t: t,
                    p0: x_scpc.p0,
                    p1: x_scpc.p1,
                    p2: x_scpc.p2,
                    p3: x_scpc.p3
                };
                var y_binom_conf = {
                    t: t,
                    p0: y_scpc.p0,
                    p1: y_scpc.p1,
                    p2: y_scpc.p2,
                    p3: y_scpc.p3
                };
                var v = {
                    x: binom4(x_binom_conf),
                    y: binom4(y_binom_conf),
                };
                route.push(v);
            }
            beg = end;
        }

        // Пройти по карте высот
        for (var j = 0; j <= conf.segm_height; ++j) {
            // Заполнить массив индексов ряда точек из карты высот тирейна
            var tir_ids_row = [];
            var id = j * conf.segm_width + 1;
            var end_ids = id + conf.segm_width + 1;
            while (id < end_ids) {
                tir_ids_row.push(id++);
            }
            // Сгенерировать обочины для ряда точек трассы
            var verges_conf = {
                height_map: conf.height_map,
                tir_width: conf.segm_width + 1, // Ширина карты высот
                segment_w: conf.segment_w,      // Ширина сегмента
                segment_h: conf.segment_h,      // Длинна сегмента
                route_width: conf.route_width,  // Ширины трассы
                route_centr: route[j],          // Центральная точка трассы на ряду точек тирейна
                tir_ids_row: tir_ids_row        // Ряд точек тирейна
            };
            generateVerges(verges_conf);
        }
        return pivot_verts;
    }

    /**
     * Генератор сетки
     *  segment_w       - Ширина сегмента: width / segments_width,
     *  segment_h       - Длинна сегмента: height / segments_height,
     *  pos_x           - Смещение в начало координат: -width * 0.5,
     *  pos_z           - Смещение в начало координат: -height * 0.5,
     *  segments_width  - Ширина в сегментах: segments_width,
     *  segments_height - Длинна в сегментах: segments_height
     *  height_map       - Карта высот, если нужна
     */
    Grid = function(conf) {
        var geometry = new THREE.Geometry();
        // Генерация первого ряда точек
        var swidth = conf.segments_width;
        var i;
        var y = 0;
        for (i = 0; i <= swidth; i++) {
            if (typeof conf.heght_map !== undefined) {
                y = conf.height_map[i];
            }
            geometry.vertices.push(new THREE.Vector3(conf.pos_x + i * conf.segment_w, y, -conf.pos_z));
        }
        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var sheight = conf.segments_height;
        var id_0 = 0;
        var map_id = swidth;
        for (var j = 1; j <= sheight; j++) {
            if (typeof conf.height_map !== undefined) {
                y = conf.height_map[++map_id];
            }
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(conf.pos_x, y, -(conf.pos_z + j * conf.segment_h)));
            // Генерация верхнего ряда точек c центральными точками
            for (i = 1; i <= swidth; i++) {
                var vec = {
                    x: conf.pos_x + (i * conf.segment_w - conf.segment_w * 0.5),
                    z: -(conf.pos_z + (j * conf.segment_h - conf.segment_h * 0.5))
                };
                var mv = new THREE.Vector3(vec.x, 0, vec.z);
                geometry.vertices.push(mv);

                vec.x = conf.pos_x + i * conf.segment_w;
                vec.z = -(conf.pos_z + j * conf.segment_h);
                if (typeof conf.height_map !== undefined) {
                    y = conf.height_map[++map_id];
                }
                var lv = new THREE.Vector3(vec.x, y, vec.z);
                geometry.vertices.push(lv);

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

                // Получение высоты средней точки сегмента
                if (typeof conf.height_map !== undefined) {
                    geometry.vertices[id_3].y = (
                        geometry.vertices[id_0].y + geometry.vertices[id_1].y + geometry.vertices[id_2].y + geometry.vertices[id_4].y
                        ) * 0.25;
                }
                // Пересчёт индекса нижней левой точки сектора в ряду
                id_0 += (j > 1) ? 2 : 1;
            }
        }
        return geometry;
    };

// TODO
// 1. Убрать смещение опорных точек в центр координат

    // Построение игрового пространства
    var _segment_w = conf.width / conf.segments_width;
    var _segment_h = conf.height / conf.segments_height;

    // Генерация Холмов
    var hm_conf = {
        hills: NUM_HILLS,
        segm_width: conf.segments_width + 1, // карта высот опирается на крайние точки сегмента
        segm_height: conf.segments_height + 1 // карта высот опирается на крайние точки сегмента
    };
    var _height_map = new HegthMap(hm_conf);

    // * Тестовая картинка карты высот
    var pixelData = new Uint8Array(hm_conf.segm_width * hm_conf.segm_height * 4);
    var aid = 0;
    for (var y = 0; y < hm_conf.segm_height; ++y) {
        for (var x = 0; x < hm_conf.segm_width; ++x) {
            id = y * hm_conf.segm_width + x;
            aid = id * 4;
            var ht = _height_map[id] / 10;
            var c = Math.floor(255 * (10 < ht ? 1 : ht));
            pixelData[aid] = c;
            pixelData[aid + 1] = c;
            pixelData[aid + 2] = c;
            pixelData[aid + 3] = 255;
        }
    }
    const dataTexture = new THREE.DataTexture(
        pixelData,
        hm_conf.segm_width,
        hm_conf.segm_height,
        THREE.RGBAFormat,
        THREE.UnsignedByteType,
        THREE.UVMapping);
    dataTexture.needsUpdate = true;
    var _hm_mat = new THREE.SpriteMaterial( { map: dataTexture } );
    var _hm_sprite = new THREE.Sprite( _hm_mat );
    _hm_sprite.position.set(0, 5, 0);
    _hm_sprite.scale.set(hm_conf.segm_width / 5, hm_conf.segm_height / 5, 1);
    _scope.add(_hm_sprite);
    // * __________________________________________________

    // Генерация опорных точек трассы
    var rp_conf = {
        width: conf.width,
        route_width: conf.route_width,
        min_points: MIN_ROUTE_PIVOUT_COUNT,
        max_points: MAX_ROUTE_PIVOUT_COUNT
    };
    var _route_pivots = generatePivoutPoints(rp_conf);

    // Построение трассы
    var route_conf = {
        height_map: _height_map,
        segm_width: conf.segments_width,
        segm_height: conf.segments_height,
        segment_w: _segment_w,
        segment_h: _segment_h,
        route_pivots: _route_pivots,
        route_width: conf.route_width
    };
    var _pivot_verts = generateRoute(route_conf);

    // // * Отрисовка опорных точек
    // var darkMaterial = new THREE.MeshBasicMaterial( { color: 0x7777cc } );
    // var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true, transparent: true } );
    // var multiMaterial = [ darkMaterial, wireframeMaterial ];
    // for(var sp in _pivot_verts) {
    //     var octagedron = new THREE.OctahedronGeometry(0.5, 0);
    //     var shape = THREE.SceneUtils.createMultiMaterialObject(octagedron, multiMaterial);
    //     var pos = _pivot_verts[sp];
    //     shape.position.set(pos.x, pos.y, pos.z + conf.height * 0.5);
    //     _scope.add(shape);
    // }
    // // * __________________________________________________

    // Генерация сетки тирейна
    var grid_conf = {
        segment_w: _segment_w,
        segment_h: conf.height / conf.segments_height,
        pos_x: -conf.width * 0.5,
        pos_z: -conf.height * 0.5,
        segments_width: conf.segments_width,
        segments_height: conf.segments_height,
        height_map: _height_map,
    };
    var _terrain_geometry = new Grid(grid_conf);
    _terrain_geometry.computeFaceNormals();
    // _terrain_geometry..computeVertexNormals();
    // _terrain_geometry..computeTangents();

    var _mat_tir = new THREE.MeshBasicMaterial({ color:0x000808, wireframe: true, transparent: true });
    var _mesh_tir = new THREE.Mesh(_terrain_geometry, _mat_tir);
    _mesh_tir.receiveShadow  = true;
    _scope.add(_mesh_tir);

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
