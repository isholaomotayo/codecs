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
            playpause:    elem('button', 'playpause'),
            seekbar:    elem(0, 'seekbar'),
            timedisplay:    elem(0, 'timedisplay'),
            visualizer:    elem('canvas', 'visualizer'),
            loadhead:    elem(0, 'loadhead'),
            playhead:    elem(0, 'playhead'),
        };

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
        $playpause.click(function (e) {
            if (!self.onplay || !self.onpause) return;

            self.isPlaying = !self.isPlaying;
            $playpause.html('<span>' + (self.isPlaying ? '&#x25AE;&#x25AE;' : '&#x25B6;') + '</span>');
            self[self.isPlaying ? 'onpause' : 'onplay']();
        });
        $playpause.html('<span>&#x25B6;</span>');
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
    parentElement: null,
    onseek: null,
    onpause: null,
    onplay: null,
};

return Player;

}());
