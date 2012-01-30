var Visualizer = (function(){

var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
                return window.setTimeout(callback, 1000 / 60);
            };
})();

var clearAnimFrame = (function(){
    return  window.clearAnimationFrame       ||
            window.webkitClearAnimationFrame ||
            window.mozClearAnimationFrame    ||
            window.oClearAnimationFrame      ||
            window.msClearAnimationFrame     ||
            function(id){
                window.clearTimeout(id);
            };
});

function extend (obj) {
    var args    = arguments,
        l       = args.length,
        i, n;

    for (i=1; i<l; i++) {
        for (n in args[i]) {
            if (args[i].hasOwnProperty(n)) {
                obj[n] = args[i][n];
            }
        }
    }

    return obj;
}

var isMacWebKit = /Mac OS X/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent);

function FrameTimer (callback) {
    this.callback = callback;
    this.lastHit = +new Date;

    var self = this;

    this._callback = function(){
        self.nextFrame();
    };

    this.fpsTimer = setInterval(function () {
        self.calculateFPS();
    }, 1000);

    this.start();
}

FrameTimer.prototype = {
    _callback: null,
    fpsTimer: null,
    callback: null,
    id: null,

    stopped: false,
    fps: 0,
    frameCount: 0,
    lastHit: 0,

    start: function () {
        this.id = requestAnimFrame(this._callback);
    },

    nextFrame: function () {
        if (this.stopped) return;
        this.frameCount++;
        this.callback && this.callback();
        this.start();
    },

    clear: function () {
        this.stopped = true;
        this.id === null || clearAnimFrame(this.id);
        this.fpsTimer === null || clearInterval(this.fpsTimer);
        this.id = null;
    },

    calculateFPS: function () {
        var hit = +new Date;

        this.fps = ~~(this.frameCount / (hit - this.lastHit) * 1000);

        this.frameCount = 0;
        this.lastHit    = hit;
    },
};

function Visualizer (canvas, fft, notPaused) {
    this.elem   = canvas;
    this.fft    = fft;
    this.width  = this.elem.width   = this.elem.clientWidth;
    this.height = this.elem.height  = this.elem.clientHeight;
    this.paused = !notPaused;
    !this.paused && this.start();

    var self = this;

    this.elem.onclick = function () {
        self.paused || (self.timer ? self.stop() : self.start());
    };

    var i = Visualizer.backends.length;

    while (i-- && !Visualizer.backends[i](this));

    if (!this.draw) throw new Error('No visualizer backend available.');

    console.log('Using', this.type, 'visualizer');
}

Visualizer.prototype = {
    elem: null,
    timer: null,
    fft: null,
    paused: true,

    start: function () {
        var self = this;
        this.timer = new FrameTimer(function(){
            self.draw();
        });
    },

    stop: function () {
        this.timer && this.timer.clear();
        this.timer = null;
    },

    draw: null,
};

Visualizer.backends = [];

function Canvas2DVisualizer (visualizer) {
    try {
        visualizer.ctx = visualizer.elem.getContext('2d');
    } catch (e) {}

    if (!visualizer.ctx) return;

    extend(visualizer, Canvas2DVisualizer.prototype);

    visualizer.init();

    return true;
}

Canvas2DVisualizer.prototype = {
    type: '2D',
/*
    ctx: null,
*/
    m_ctx: null,

    barWidth: 4,
    f: 0,
    r: 10,

    init: function () {
        this.offc           = document.createElement('canvas');
        this.offc.width     = this.width;
        this.offc.height    = this.height;
        this.m_ctx          = this.offc.getContext('2d');
    },

    draw: function () {
        var c   = this.elem,
            ctx = this.m_ctx,
            fft = this.fft,
            w   = c.width,
            h   = c.height,
            f   = this.f,
            r   = this.r,
            bw  = this.barWidth,
            grad= ctx.createLinearGradient(0, -h / 2, 0, h / 2),
            t   = +new Date / 1000,
            m   = Math.min(fft.spectrum.length, w),
            i;  

            ctx.save();

            ctx.fillStyle = 'rgba(20,21,23,0.32)';
            ctx.fillRect(0, 0, w, h); 

            grad.addColorStop(0.0, 'rgba(0,0,0,0.5)');
            grad.addColorStop(0.25, 'hsla(' + ~~(f - f / 3) + ',100%,25%,0.6)');
            grad.addColorStop(0.5, 'hsla(' + ~~(f) + ',100%,50%,0.7)');
            grad.addColorStop(0.75, 'hsla(' + ~~(f - f / 3) + ',100%,25%,0.6)');
            grad.addColorStop(1.0, 'rgba(0,0,0,0.5)');

            ctx.fillStyle           = grad;
if (!isMacWebKit) {
            ctx.shadowOffsetX       = ctx.shadowOffsetY = 0;
            ctx.shadowBlur          = 10; 
            ctx.shadowColor         = 'rgba(255,255,255,0.35)';
}
            ctx.translate(0, h/2);
            ctx.scale(1, h * 15); 
            ctx.beginPath();
            ctx.moveTo(0, 0); 
            if (this.paused) {
                for (i=0; i<w; i++){
                        ctx.lineTo(i, (1 / Math.abs(i - r + 3)) / 35 + 0.001);
                }

                while(i--){
                        ctx.lineTo(i, -(1 / Math.abs(i - r + 3)) / 35);
                }
            } else {
                for (i=0; i<m; i++){
                        ctx.lineTo(i, fft.spectrum[i] + 0.001);
                }

                while(i--){
                        ctx.lineTo(i, -fft.spectrum[i]);
                }
            }

            ctx.closePath();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fill();

            ctx.restore();
            this.f = (f + 0.3) % 360;
            this.r = (r + 2.73) % (w * 2);

            this.ctx.drawImage(this.offc, 0, 0);
    },
};

Visualizer.backends.push(Canvas2DVisualizer);

// "position" = "p"
var vertexSource = "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}";
// "time" = "t"
var fragmentSource = "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D fft;uniform vec2 r;uniform float t;" +
"void main(void){vec2 p=-1.0+2.0*gl_FragCoord.xy/r.xy;float a=t*0.15;float f=(sin(a)+1.0)/2.0;float h=max(texture2D(fft,vec2((p.x+1.0)/2.0,0.0)).r,0.15);" +
"float v=1.0-abs(p.y)/h;float y=v/h;if(y<0.1)y=4.0;gl_FragColor=vec4(vec3(0.5,f,0.1)*v*min(h*2.2,2.2),1.0);}";

function get3DContext (canvas) {
    var names   = ["webgl", "experimental-webgl"],
        ctx     = null,
        i;

    for (i=0; i<names.length; i++) {
        try {
            ctx = canvas.getContext(names[i]);
        } catch(e) {}

        if (ctx) break;
    }
    return ctx;
}

function loadShader (gl, shaderSource, shaderType) {
    var shader  = gl.createShader(shaderType),
        compiled, lastError;

    gl.shaderSource(shader, shaderSource);

    gl.compileShader(shader);

    compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!compiled) {
        lastError = gl.getShaderInfoLog(shader);
        console.error('GLSL:', shader, '-', lastError);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram (gl, shaders, attributes, locations) {
    var program = gl.createProgram(),
        i, linked, lastError;

    for (i=0; i<shaders.length; i++) {
        gl.attachShader(program, shaders[i]);
    }

    if (attributes) {
        for (i=0; i<attributes.length; i++) {
            gl.bindAttribLocation(program, locations ? locations[i] : i, attributes[i]);
        }
    }

    gl.linkProgram(program);

    linked = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!linked) {
        lastError = gl.getProgramInfoLog (program);
        console.error("Linking:", lastError);

        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function Canvas3DVisualizer (visualizer) {
    visualizer.gl = get3DContext(visualizer.elem);

    if (!visualizer.gl) return;

    extend(visualizer, Canvas3DVisualizer.prototype);

    visualizer.init();

    return true;
}

Canvas3DVisualizer.prototype = {
    type: 'WebGL',

/*
    gl: null,
*/
    fftBuffer: null,
    traBuffer: null,
    vs: null,
    fs: null,
    pl: null,
    tl: null,
    rl: null,
    fl: null,
    ft: null,
    sp: null,
    

    fftSize: 128,
    t: 0,

    init: function () {
        var self = this;

        self.vs = loadShader(self.gl, vertexSource, self.gl.VERTEX_SHADER);
        self.fs = loadShader(self.gl, fragmentSource, self.gl.FRAGMENT_SHADER);
        self.sp = createProgram(self.gl, [self.vs, self.fs]);
        self.gl.useProgram(self.sp);

        self.fftBuffer = new Uint8Array(self.fftSize * 4);
        self.traBuffer = new Uint8Array(self.fftSize * 4);

        self.pl = self.gl.getAttribLocation(self.sp, "p");
        self.tl = self.gl.getUniformLocation(self.sp, "t");
        self.rl = self.gl.getUniformLocation(self.sp, "r");
        self.fl = self.gl.getUniformLocation(self.sp, "fft");
        self.ft = self.gl.createTexture();

        self.gl.bindTexture(self.gl.TEXTURE_2D, self.ft);
        self.gl.texImage2D(self.gl.TEXTURE_2D, 0, self.gl.RGBA, self.fftSize, 1, 0, self.gl.RGBA, self.gl.UNSIGNED_BYTE, self.fftBuffer);
        self.gl.texParameteri(self.gl.TEXTURE_2D, self.gl.TEXTURE_MAG_FILTER, self.gl.LINEAR);
        self.gl.texParameteri(self.gl.TEXTURE_2D, self.gl.TEXTURE_MIN_FILTER, self.gl.LINEAR);
        self.gl.bindTexture(self.gl.TEXTURE_2D, null);

        self.vb = self.gl.createBuffer();
        self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.vb);
        self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0,  1.0]),
        self.gl.STATIC_DRAW);
        self.gl.enableVertexAttribArray(self.pl);
        self.gl.vertexAttribPointer(self.pl, 2, self.gl.FLOAT, false, 0, 0);

        self.gl.clearColor(0.0, 0.0, 0.0, 0.5);
    },

    draw: function () {
        var self = this,
            step = self.fft.spectrum.length / self.fftBuffer.length / 3,
            trns = 0.3,
            i;

        self.gl.clear(self.gl.COLOR_BUFFER_BIT);

        self.t += 0.05;
        
        self.gl.uniform1f(self.tl, self.t);

        self.gl.uniform2f(self.rl, self.elem.width, self.elem.height);

        for (i=0; i<self.traBuffer.length; i+=4) {
            self.traBuffer[i] = self.fft.spectrum[~~(i * step)] * 255 * 140;
        }

        for (i=0; i<self.fftBuffer.length; i+=4) {
            if (self.fftBuffer[i] < self.traBuffer[i]) {
                self.fftBuffer[i] = Math.min(self.fftBuffer[i] + (self.traBuffer[i] - self.fftBuffer[i]) * trns, self.traBuffer[i]);
            }

            if (self.fftBuffer[i] > self.traBuffer[i]) {
                self.fftBuffer[i] = Math.max(self.fftBuffer[i] + (self.traBuffer[i] - self.fftBuffer[i]) * trns, self.traBuffer[i]);
            }
        }

        self.gl.activeTexture(self.gl.TEXTURE0);
        self.gl.bindTexture(self.gl.TEXTURE_2D, self.ft);
        self.gl.texImage2D(self.gl.TEXTURE_2D, 0, self.gl.RGBA, self.fftSize, 1, 0, self.gl.RGBA, self.gl.UNSIGNED_BYTE, self.fftBuffer);
        self.gl.uniform1i(self.fl, 0);

        self.gl.drawArrays(self.gl.TRIANGLES, 0, 6);
    },
};

Visualizer.backends.push(Canvas3DVisualizer);

return Visualizer;

}());
