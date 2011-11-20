this.Player = (function(){

function elem (type, classList) {
    var e = document.createElement(type || 'div');
    classList && e.classList.add.apply(e.classList, classList.split(' '));
    return e;
}
function append (p) {
    [].slice.call(arguments, 1).forEach(function(e){
        p.appendChild(e);
    });
}

function Player (parentElement) {
    this.parentElement = parentElement;
    this.createUI();
}

Player.prototype = {
    isPlaying: false,
    createUI: function() {
        this.UI = {
            container:    elem(0, 'player'),
            playpause:    elem('button', 'playpause play'),
            seekbar:    elem(0, 'seekbar'),
            timedisplay:    elem(0, 'timedisplay'),
            visualizer:    elem('canvas', 'visualizer'),
            loadhead:    elem(0, 'loadhead'),
            playhead:    elem(0, 'playhead'),
        };

        this.UI.container.setAttribute('tabindex', 0);

        append(this.parentElement, this.UI.container);

        append(this.UI.container, this.UI.playpause, this.UI.seekbar, this.UI.visualizer);

        append(this.UI.seekbar, this.UI.loadhead, this.UI.playhead, this.UI.timedisplay);

        var self = this;

        var $seekbar = $(this.UI.seekbar);
        $seekbar.click(function (e) {
            if (!self.onseek) return;
            self.onseek((e.pageX - $seekbar.offset().left) / self.UI.seekbar.clientWidth);
        });

        var $playpause = $(this.UI.playpause);

        function eventPlayPause(e) {
            if (!self.onplay || !self.onpause || (e.which !== 1 && e.which !== 32)) return;

            self.updatePlaying(!self.isPlaying);

            self[self.isPlaying ? 'onplay' : 'onpause']();
        }

        $playpause.click(eventPlayPause);
        $playpause.html('<span>&#x25B6;</span>');

        var $container = $(this.UI.container);
        $container.keyup(eventPlayPause);
    },
    updateLoadHead: function (position) {
        this.UI.loadhead.style.width = Math.floor(this.UI.seekbar.clientWidth * position) + 'px';
    },
    updatePlayHead: function (position) {
        this.UI.playhead.style.width = Math.floor(this.UI.seekbar.clientWidth * position) + 'px';
    },
    updateTime: function (time) {
        this.UI.timedisplay.innerHTML = time;
    },
    updatePlaying: function(playing) {
        if (playing === this.isPlaying) return;
        this.isPlaying = playing;
        this.UI.playpause.innerHTML = '<span>' + (this.isPlaying ? '&#x25AE;&#x25AE;' : '&#x25B6;') + '</span>';
        this.UI.playpause.classList.remove(this.isPlaying ? 'play' : 'pause');
        this.UI.playpause.classList.add(this.isPlaying ? 'pause' : 'play');
    },
    parentElement: null,
    onseek: null,
    onpause: null,
    onplay: null,
};

return Player;

}());
