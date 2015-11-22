var UTILS = {};

UTILS.CreateStyle = function(inner_html) {
    var style = document.createElement('style');
    style.innerHTML = inner_html;
    document.head.appendChild(style);
    return style;
};

UTILS.CreateContainer = function(container_name) {
    var container = document.createElement('div');
    container.id = container_name;
    document.body.appendChild(container);
    return container;
};


UTILS.Display = function(element) {
    var _element = element;

    getRealDisplay = function(elem) {
        var computedStyle;
        if (elem.currentStyle) {
            return elem.currentStyle.display;
        } else if (window.getComputedStyle) {
            computedStyle = window.getComputedStyle(elem, null);
            return computedStyle.getPropertyValue('display');
        }
    };

    this.hide = function() {
        _element.style.display = "none";
    };

    var _display_cache = {};

    this.show = function() {
        if (getRealDisplay(_element) !== 'none') {
            return;
        }

        var old = _element.getAttribute("displayOld");
        _element.style.display = old || "";

        if (getRealDisplay(_element) === "none") {
            var node_name = _element.nodeName;
            var body = document.body;
            var display = null;
            if (_display_cache[node_name]) {
                display = _display_cache[node_name];
            } else {
                var test_element = document.createElement(node_name);
                body.appendChild(test_element);
                display = getRealDisplay(test_element);
                if (display === "none") {
                    display = "block";
                }
                body.removeChild(test_element);
                _display_cache[node_name] = display;
            }
            _element.setAttribute('displayOld', display);
            _element.style.display = display;
        }
    };
};


UTILS.getGradientTexture = function(w, h) {
    //var end_r = (w < h) ? h/2 : w/2;
    //var gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, end_r);
    //gradient.addColorStop(0.5, 'rgba(10,15,50,0.9)');
    //gradient.addColorStop(1, 'rgba(60,60,80,0.6)');
    //return gradient;

    var canvas = document.createElement( 'canvas' );
    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(w / 2,  h / 2,  0,  w / 2,  h / 2,  w / 2);
    gradient.addColorStop(0.5, 'rgba(15,15,50,1)');
    gradient.addColorStop(1, 'rgba(60,60,80,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, w, h);
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
};


UTILS.loadTexture = function(path, callback, texture_placeholder) {
    var texture = new THREE.Texture(texture_placeholder);
    var material = new THREE.MeshPhongMaterial({map:texture, overdraw:true});
    var image = new Image();
    image.onload = function() {
        texture.needsUpdate = true;
        material.map.image = this;
        callback();
    };
    image.src = path;
    return material;
};


UTILS.ProgressManager = function() {
    var _manager = new THREE.LoadingManager();
    _manager.onProgress = function(item, loaded, total) {
        //console.log(item, loaded, total);
    };

    this.manager = function() {
        return _manager;
    }
};


UTILS.TextureLoader = function() {
    var _loader;
    var _texture;
    var _on_load;

    this.load = function(manager, texture_path, on_load) {
        _on_load = on_load;
        _loader = new THREE.ImageLoader(manager);
        _loader.load(texture_path, onLoad);
    };

    function onLoad(image) {
        _texture = new THREE.Texture();
        _texture.image = image;
        _texture.needsUpdate = true;
        _texture.wrapS = _texture.wrapT = THREE.RepeatWrapping;
        _texture.anisotropy = 16;
        if (_on_load) {
            _on_load(_texture);
        }
    }
};


UTILS.ObjLoader = function() {
    var _loader;
    var _on_load;

    this.load = function(manager, obj_path, on_load) {
        _on_load = on_load;
        _loader = new THREE.OBJLoader(manager);
        _loader.load(obj_path, onLoad, onProgress, onError);
    };

    function onLoad(object) {
        if(_on_load) {
            _on_load(object);
        }
    }


    function onProgress() {
        console.log("onProgress");
    }

    function onError() {
        console.log("Obj loading error.");
    }
};



var AEROBIKE = {VERSIION: '0.1'};

AEROBIKE.Garage = function() {
    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _mouse_x = 0;
    var _mouse_y = 0;
    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _group = new THREE.Group();
    var _scene = new THREE.Scene();
    var _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    var _progress = new UTILS.ProgressManager();

    this.init = function(on_complete) {
        var obj_texture = new UTILS.TextureLoader();
        obj_texture.load(_progress.manager(), "./images/test.jpg", function(texture) {
            var obj_loader = new UTILS.ObjLoader();
            obj_loader.load(_progress.manager(), "./objs/bike.obj", function(obj) {
                obj.position.y = 100;
                obj.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            map:texture, color:0xffffff, shininess:50, shading:THREE.SmoothShading
                        });
                    }
                });
                _group.add(obj);
            });
        });
        var ground_texture = new UTILS.TextureLoader();
        ground_texture.load(_progress.manager(), "./images/lavatile.jpg", function(texture) {
            var ground_geometry = new THREE.PlaneBufferGeometry(1000, 1000);
            ground_geometry.rotateX(-Math.PI / 2);
            var ground_material = new THREE.MeshPhongMaterial({
                map:texture, bumpMap:texture, bumpScale:2, color:0x00ff00,
                specular:50, shininess:0x333333, shading:THREE.SmoothShading
            });
            var plane = new THREE.Mesh(ground_geometry, ground_material);
            _group.add(plane);
        });
        _group.position.y = -150;

        _scene.add(new THREE.AmbientLight(0xffffff));
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 0).normalize();
        _scene.add(directionalLight);
        //var particle_light = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
        //particle_light.add(new THREE.PointLight(0xffffff, 2, 700));
        //particle_light.position.y = 200;

        //_scene.add(particle_light);
        _scene.add(_group);

        _camera.position.z = 400;
    };

    this.scene = function() {
        return _scene;
    };

    this.camera = function() {
        return _camera;
    };

    this.resize = function() {
        _mouse_x = 0;
        _mouse_y = 0;
        _window_half_x = window.innerWidth * 0.5;
        _window_half_y = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _camera.aspect = window.innerWidth / window.innerHeight;
        _camera.updateProjectionMatrix();
    };

    this.update = function() {
        _group.rotation.y -= X_SCENE_ROTATION;
        _camera.position.x += (_mouse_x * X_VIEW_PERCENT - _camera.position.x);
        _camera.position.y += (-_mouse_y * Y_VIEW_PERCENT - _camera.position.y);
        _camera.lookAt(_scene.position);
    };

    this.mouseMove = function(e) {
        _mouse_x = (e.clientX - _window_half_x);
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
    };
};


AEROBIKE.Game = function() {
    var _self = this;
    var _renderer;

    var _garage;

    function render() {
        _garage.update();
        _renderer.render(_garage.scene(), _garage.camera());
    }

    this.init = function() {
        new UTILS.CreateStyle("html,body{background-color:#f0f0f0;overflow:hidden;width:100 %;height:100 %;margin:0;padding:0;}");
        new UTILS.CreateStyle("#scene_container{width:100%; height:100%; touch-action:none;}");

        _renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
        _renderer.setClearColor(0x0a0c1f);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.gammaInput = true;
        _renderer.gammaOutput = true;

        var scene_container = new UTILS.CreateContainer("scene_container");
        scene_container.appendChild(_renderer.domElement);

        _garage = new AEROBIKE.Garage();
        _garage.init();

        document.addEventListener('mousedown',  onMouseDown,  false);
        document.addEventListener('mouseup',    onMouseUp,    false);
        document.addEventListener('mousemove',  onMouseMove,  false);
        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('touchstart', onTouchStart, false);
        document.addEventListener('touchmove',  onTouchMove,  false);

        window.addEventListener('resize', onWindowResize, false);

        //var display = new UTILS.Display(scene_container);
        //display.hide();
        //display.show();
    };

    function onWindowResize() {
        _garage.resize();
        _renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }

    function onMouseDown(e) {
    }

    function onMouseUp(e) {
    }

    function onMouseMove(e) {
        _garage.mouseMove(e);
    }


    function onMouseWheel(e) {
    }

    function onTouchStart(e) {
        //if (e.touches.length == 1) {
        //    e.preventDefault();
        //    e.touches[0].pageX;
        //    e.touches[0].pageY;
        //}
    }

    function onTouchMove(e) {
        //if (e.touches.length == 1) {
        //    e.preventDefault();
        //    e.touches[0].pageX;
        //    e.touches[0].pageY;
        //}
    }

    this.animate = function() {
        requestAnimationFrame(_self.animate);
        render();
    };
};


//var ui = new UI.View();
////var container = new ui.Container(10, 10, window.innerWidth - 20, window.innerHeight - 20);
////container.open();
//
////var button = new ui.Button(undefined, window.innerWidth / 2 - 20, window.innerHeight / 2 - 20, 100, 30);
//var close_button = function() {
//    button.close();
//};
////var button = new ui.Button(close_button, 200, 100, 100, 30, "кнопка", 20);
//var button = new ui.Button(undefined, 200, 100, 100, 30, "на старт", 20);
//button.open();

var game = new AEROBIKE.Game();
game.init();
game.animate();
