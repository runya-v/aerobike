var UI = {VERSIION: '0.1'};


UI.View = function() {
    var _view = this;
    var _paper = Raphael(0, 0, window.innerWidth, window.innerHeight);


    this.Container = function(x, y, w, h) {
        var _self = this;
        var _start_x = x + w / 2 - 1;
        var _start_y = y + h / 2 - 1;
        var _default_wider = 2;
        var _open_begin_callback;
        var _open_end_callback;
        var _close_begin_callback;
        var _close_end_callback;

        var _rect = _paper.rect(_start_x, _start_y, 2, 2, 5);
        _rect.attr({"fill":"#ffffff", "stroke":"#ffffff", "stroke-width":2, cursor:"move"});

        this.open = function(callback) {
            if (_self._open_begin_callback) {
                _self._open_begin_callback();
            }
            _rect.animate({"x":x, "width":w}, 500, ">", function() {
                _rect.animate({"fill":"#7687A1", "fill-opacity":0.9, "stroke-width":1, "y":y, "height":h}, 500, ">", function() {
                    if (_self._open_end_callback) {
                        _self._open_end_callback();
                    }
                    if (callback) {
                        callback();
                    }
                })
            });
        };

        this.close = function(callback) {
            if (_self._close_begin_callback) {
                _self._close_begin_callback();
            }
            _rect.animate({"fill":"#ffffff", "fill-opacity":1, "stroke-width":2, "y":_start_y, "height":2}, 500, ">", function() {
                _rect.animate({"x": _start_x, "width": 2}, 500, ">", function() {
                    if (_self._close_end_callback) {
                        _self._close_end_callback();
                    }
                    if (callback) {
                        callback();
                    }
                })
            });
        };

        this.wider = function(callback, delta, remember) {
            if (delta == undefined) {
                delta = _default_wider;
            }

            var wider_x = x - delta;
            var wider_w = w + delta * 2;
            var end_animate;

            if (remember === true) {
                x = wider_x;
                w = wider_w;
                end_animate = function() {
                    if (callback) {
                        callback();
                    }
                }
            }
            else {
                end_animate = function() {
                    _rect.animate({"x":x, "width":w}, 500, "elastic", callback);
                }
            }
            _rect.animate({"x":wider_x, "width":wider_w}, 100, "elastic", end_animate);

            _rect.animate({"stroke-width":3}, 100, "elastic", function() {
                _rect.animate({"stroke-width":1}, 300)
            });
        };

        this.rect = function() {
            return _rect;
        }
    };


    this.Button = function(callback, x, y, w, h, text_str, text_size) {
        var _self = this;
        _view.Container.call(this, x, y, w, h);
        var _label;

        this.rect().click(function() {
            _label.animate({"font-size":text_size - (text_size / 10)}, 100, "elastic", function() {
                _label.attr({"font-size":text_size});
            });
            _self.wider(callback, -(w / 10));
        });

        _self._open_end_callback = function() {
            _label = _paper.text(x, y, text_str).attr({"fill":"#ffffff", "font-size":text_size});
            _label.translate(w / 2, h / 2);
            _label.click(function() {
                _label.animate({"font-size":text_size - (text_size / 10)}, 100, "elastic", function() {
                    _label.attr({"font-size":text_size});
                });
                _self.wider(callback, -(w / 10));
            });
        }

        _self._close_begin_callback = function() {
            _label.remove();
        }
    };
    _view.Button.prototype = Object.create(_view.Container.prototype);
    _view.Button.prototype.constructor = _view.Button;

};