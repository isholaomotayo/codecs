function createALACPlayer(url, DGPlayer, isFile){
    var ret = {};
    Sink.EventEmitter.call(ret);
    
    var player = Player.fromURL(url);
    var visual;
    
    player.volume = 50;
    player.preload();
    player.play();
    
    DGPlayer.on('play', function(){
        player.play();
        DGPlayer.state = 'playing';
        visual && (visual.paused = false);
    });
    
    DGPlayer.on('pause', function(){
        player.pause();
        DGPlayer.state = 'paused';
        visual && (visual.paused = true);
    });
    
    DGPlayer.on('volume', function(value) {
        player.volume = value;
    });
    
    player.on('ready', function() {
        DGPlayer.duration = player.duration;
        
        var fft = ret.fft = audioLib.FFT(player.sink.sampleRate, 4096);

        var visual = ret.visual = new Visualizer(document.querySelector('#alac canvas.visualization'), fft, true);

        player.sink.on('audioprocess', function(buffer, channelCount) {
            if (visual.paused || !visual.timer) return;

            for (i=0; i<buffer.length; i+=channelCount) {
                s = 0;
                for (n=0; n<channelCount; n++) {
                    s += buffer[i+n];
                }
                fft.pushSample(s / channelCount);
            }
        });
    });
    
    player.on('buffer', function(percent) {
        DGPlayer.bufferProgress = percent;
    });
    
    player.on('progress', function(time) {
        DGPlayer.seekTime = time;
    });

    ret.player  = player;
    ret.ui      = DGPlayer;

    return ret;
}
