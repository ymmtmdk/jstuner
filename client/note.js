(function () {
    "use strict";
    var Note = function(_hz) {
        this.hz = _hz;
        this.base = 55;
        this.note = Math.log(this.hz / this.base) / Math.log(2) * 12;
    };
    Note.prototype = {
        name: function() {
            var names = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];
            var note12;
            if(this.note >= 0) note12 = this.note % 12; else note12 = this.note % 12 + 12;
            var i = Math.floor((note12 + 0.5) % 12);
            return names[i];
        }
        ,diff: function() {
            return (this.note + 0.5) % 1 - 0.5;
        }
    };
    Math.NaN = Number.NaN;
    Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
    Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
    Math.isFinite = function(i) {
        return isFinite(i);
    };
    Math.isNaN = function(i1) {
        return isNaN(i1);
    };
    window.Note = Note;
})();
