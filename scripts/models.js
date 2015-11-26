/*!
 * \brief  Модуль игровых объектов игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var MODELS = {};

MODELS.Pilot = function() {};


MODELS.BikePelican = function(progress) {
    THREE.Group.call(this);
    var _scope = this;

    function BikePelican() {
        var obj_texture = new UTILS.TextureLoader(progress);
        obj_texture.load("./images/test.jpg", function(texture) {
            var obj_loader = new THREE.OBJLoader(progress);
            obj_loader.load("./objs/bike.obj", function(obj) {
                obj.position.y = 100;
                obj.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            map:texture, color:0xffffff, shininess:50, shading:THREE.SmoothShading
                        });
                    }
                });
                _scope.add(obj);
            }, function() {
                //onProgress
            }, function() {
                //onError
            });

            //var obj_loader = new UTILS.ObjLoader();
            //obj_loader.load(progress, "./objs/bike.obj", function(obj) {
            //    obj.position.y = 100;
            //    obj.traverse(function(child) {
            //        if (child instanceof THREE.Mesh) {
            //            child.material = new THREE.MeshPhongMaterial({
            //                map:texture, color:0xffffff, shininess:50, shading:THREE.SmoothShading
            //            });
            //        }
            //    });
            //    _scope.add(obj);
            //});
        });
    } BikePelican();

    this.update = function() {

    };
};
MODELS.BikePelican.prototype = Object.create(THREE.Group.prototype);
