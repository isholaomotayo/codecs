var Visualizer = (function(){

// FIXME: This is basically just a functionality test, not very good looking or clever...

function Visualizer(canvas, fft, notPaused) {
    this.elem   = canvas;
    this.fft    = fft;
    this.width  = this.elem.clientWidth;
    this.height = this.elem.clientHeight;
    this.paused = !notPaused;
    !this.paused && this.start();
}

Visualizer.prototype = {
    elem: null,
    fft: null,
    timer: null,
    barWidth: 4,
    f: 0,
    r: 10,
    paused: true,
    start: function () {
        var self = this;
        this.timer = setInterval(function(){
            self.draw();
        }, 1000/60);
    },
    stop: function () {
        this.timer && clearInterval(this.timer);
        this.timer = null;
    },
    draw: function () {
        var c   = this.elem,
            ctx = c.getContext('2d'),
            fft = this.fft,
            w   = c.width,
            h   = c.height,
            f   = this.f,
            r   = this.r,
            bw  = this.barWidth,
            grad= ctx.createLinearGradient(0, -h / 2, 0, h / 2),
            t   = +new Date / 1000,
            m   = Math.min(fft.spectrum.length, w)
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
            ctx.shadowOffsetX       = ctx.shadowOffsetY = 0;
            ctx.shadowBlur          = 10; 
            ctx.shadowColor         = 'rgba(255,255,255,0.35)';
            ctx.translate(0, h/2);
            ctx.scale(1, h * 15); 
            ctx.beginPath();
            ctx.moveTo(0, 0); 
            if (this.paused) {
                for (i=0; i<w; i++){
                        ctx.lineTo(i, (1 / Math.abs(i - r + 3)) / 35 + 0.001);
                }

                while(i--){
                        ctx.lineTo(i, -(1 / Math.abs(i - r + 3)) / 35 + 0.001);
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
    },
};

return Visualizer;

}());
