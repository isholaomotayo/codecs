var Visualizer = (function(){

// FIXME: This is basically just a functionality test, not very good looking or clever...

function Visualizer(canvas, fft) {
    var self = this;
    this.elem = canvas;
    this.fft = fft;
    setInterval(function(){
        self.draw();
    }, 1000/60);
}

Visualizer.prototype = {
    elem: null,
    fft: null,
    barWidth: 4,
    f: 0,
    draw: function () {
        var c   = this.elem,
            ctx = c.getContext('2d'),
            fft = this.fft,
            buf = fft.buffer,
            w   = c.width,
            h   = c.height,
            l   = buf.length / 2,
            f   = this.f,
            bw  = this.barWidth,
            grad= ctx.createLinearGradient(0, -h / 2, 0, h / 2), 
            i;  

            ctx.save();

            ctx.fillStyle = 'rgba(0,0,0,0.2)';
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

            for (i=0; i<fft.spectrum.length; i++){
                    ctx.lineTo(i, fft.spectrum[i]);
            }   

            while(i--){
                    ctx.lineTo(i, -fft.spectrum[i]);
            }   

            ctx.closePath();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fill();

            ctx.restore();
            this.f = (f + 0.3) % 360;

    },
};

return Visualizer;

}());