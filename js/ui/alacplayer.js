function createALACPlayer(url, DGPlayer, isFile){
    var ret = {};
    Sink.EventEmitter.call(ret);

    var bus = {
        send: function () {
            console.log("Message Bus: ", arguments)
        }
    };

    var httpSource = new Aurora.HTTPSource("Source");
    var cafDemuxer = new Aurora.CAFDemuxer("Demuxer");
    var alacDecoder = new Aurora.ALACDecoder("Decoder");
    var buffer = new Aurora.Queue("Buffer");

    httpSource.url = url;

    httpSource.chunkSize = 128 * 1024;

    httpSource.messagebus = bus;
    cafDemuxer.messagebus = bus;
    alacDecoder.messagebus = bus;

    httpSource.outputs.data = cafDemuxer.inputs.data;

    cafDemuxer.outputs.metadata = alacDecoder.inputs.metadata;
    cafDemuxer.outputs.cookie = alacDecoder.inputs.cookie;
    cafDemuxer.outputs.data = alacDecoder.inputs.data;

    alacDecoder.outputs.audio = buffer.inputs.contents;

    buffer.onHighwaterMark = function () {
        console.log("Hitting High-Water Mark, Aurora o'hoy! Lets start playing!");
        
        var output = buffer.outputs.contents;
        
        var f = output.receive();
        var frame = new Int16Array(f.data.buffer), frameOffset = 0;
        
        var sink = Sink(function(buffer, channelCount) {
            if (!player.playing) return;

            var bufferOffset = 0;

            while (frame && bufferOffset < buffer.length) {
                for (var i = 0; i < Math.min(frame.length - frameOffset, buffer.length - bufferOffset); i++) {
                    buffer[bufferOffset + i] = frame[frameOffset + i] / 0x8000;
                }
                
                bufferOffset += i, frameOffset += i;
                
                if (frameOffset == frame.length) {
                    f = output.receive();
                    
                    if (f) {
                        frame = new Int16Array(f.data.buffer), frameOffset = 0;
                    } else {
                        frame = null, frameOffset = 0;
                    }
                }
            }
        }, 2, null, 44100);

        sink.on('error', function(e){ console.log(e) });

        var player = {
            playing: false,
            setPlaying: function (val) {
                this.playing = val;
                this.emit([val ? 'play' : 'pause']);
            },
        };

        Sink.EventEmitter.call(player);

        DGPlayer.on('play', function(){
            player.setPlaying(true);
            DGPlayer.state = 'playing';
        });
        DGPlayer.on('pause', function(){
            player.setPlaying(false);
            DGPlayer.state = 'paused';
        });
        DGPlayer.on('volume', function(value) {
            gain.setParam('gain', value / 100);
        });

        player.on('play', function () {
            DGPlayer.state = 'playing';
            visual && (visual.paused = false);
        });
        player.on('pause', function () {
            DGPlayer.state = 'paused';
            visual && (visual.paused = true);
        });
        player.on('progress', function(current, total, preload) {
            // Do something here
        });



        fft         = audioLib.FFT(sink.sampleRate, 4096);
        gain        = audioLib.GainController.createBufferBased(sink.channelCount, sink.sampleRate, DGPlayer.volume / 100);
        gain.mix    = 1.0;

        sink.on('audioprocess', function(buffer, channelCount) {
            if (!player.playing) return;

            for (i=0; i<buffer.length; i+=channelCount) {
                s = 0;
                for (n=0; n<channelCount; n++) {
                    s += buffer[i+n];
                }
                fft.pushSample(s / channelCount);
            }

            gain.append(buffer, channelCount);
        });

        var visual = new Visualizer(document.querySelector('#alac canvas.visualization'), fft, true);

        ret.UI      = DGPlayer;
        ret.player  = player;
        ret.visual  = visual;
        ret.fft     = fft;
        ret.vol     = gain;

        ret.emit('ready', []);
    };

    buffer.start();
    alacDecoder.start();
    cafDemuxer.start();
    httpSource.start();
    return ret;
}
