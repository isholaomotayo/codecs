function createMadPlayer(url, DGPlayer, isFile){
    var ret = {};

    Mad.Player[isFile ? 'fromFile' : 'fromURL'](url, function(player) {
        var madUI, madPlayer, madVisual, fft, gain;
        madPlayer   = player;
        madUI       = DGPlayer;

        madUI.on('play', function(){
            madPlayer.setPlaying(true);
            madUI.state = 'playing';
        });
        madUI.on('pause', function(){
            madPlayer.setPlaying(false);
            madUI.state = 'paused';
        });
        madUI.on('volume', function(value) {
            gain.setParam('gain', value / 100);
        });

        madPlayer.onPause = madPlayer.onPlay = function(){
            madUI.state = madPlayer.playing ? 'playing' : 'paused';
            madVisual && (madVisual.paused = !madPlayer.playing);
        };
        madPlayer.onProgress = function(current, total, preload) {
            madUI.bufferProgress = Math.round(preload * 100);
            madUI.seekTime = Math.floor(current * 1000);
            madUI.duration = Math.floor(total * 1000);
        };

        madPlayer.createDevice();

        fft         = audioLib.FFT(madPlayer.sampleRate, 4096);
        gain        = audioLib.GainController.createBufferBased(madPlayer.channelCount, madPlayer.sampleRate, madUI.volume / 100);
        gain.mix    = 1.0;

        madVisual = new Visualizer(document.querySelector('.player canvas.visualization'), fft, true);

        madPlayer.onPostProcessing = function(buffer, channelCount) {
            if (!madPlayer.playing || madVisual.paused || !madVisual.timer) return;

            for (i=0; i<buffer.length; i+=channelCount) {
                s = 0;
                for (n=0; n<channelCount; n++) {
                    s += buffer[i+n];
                }
                fft.pushSample(s / channelCount);
            }

            gain.append(buffer, channelCount);
        };

        ret.UI      = madUI;
        ret.player  = madPlayer;
        ret.visual  = madVisual;
        ret.fft     = fft;
        ret.vol     = gain;

        if (ret.onready) {
            ret.onready();
        }
    });
    return ret;
}
