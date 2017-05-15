"use strict";
var Complex = function(r,i) {
  this.real = r;
  this.imag = i;
};
Complex.prototype = {
  multi_f: function(f) {
    return new Complex(this.real * f,this.imag * f);
  }
  ,multi_f_bang: function(f) {
    this.real *= f;
    this.imag *= f;
    return this;
  }
  ,multi: function(c) {
    return new Complex(this.real * c.real - this.imag * c.imag,this.real * c.imag + this.imag * c.real);
  }
  ,multi_bang: function(c) {
    this.real = this.real * c.real - this.imag * c.imag;
    this.imag = this.real * c.imag + this.imag * c.real;
    return this;
  }
  ,minus: function(c) {
    return new Complex(this.real - c.real,this.imag - c.imag);
  }
  ,minus_bang: function(c) {
    this.real -= c.real;
    this.imag -= c.imag;
    return this;
  }
  ,plus: function(c) {
    return new Complex(this.real + c.real,this.imag + c.imag);
  }
  ,plus_bang: function(c) {
    this.real += c.real;
    this.imag += c.imag;
    return this;
  }
  ,exp: function() {
    var expReal = Math.exp(this.real);
    return new Complex(expReal * Math.cos(this.imag),expReal * Math.sin(this.imag));
  }
  ,exp_bang: function() {
    var expReal = Math.exp(this.real);
    this.real = expReal * Math.cos(this.imag);
    this.imag = expReal * Math.sin(this.imag);
    return this;
  }
  ,abs2: function() {
    return new Complex(this.real * this.real + this.imag * this.imag,0);
  }
};

var FFT = function() { };
FFT.fft_ = function(n,s,eo,x,y) {
  var m = Math.floor(n / 2);
  var theta = 2.0 * Math.PI / n;
  if(n == 1) {
    if(eo) {
      var _g = 0;
      while(_g < s) {
        var q = _g++;
        y[q] = x[q];
      }
    }
  } else {
    var _g1 = 0;
    while(_g1 < m) {
      var p = _g1++;
      var wp = new Complex(Math.cos(p * theta),-Math.sin(p * theta));
      var _g11 = 0;
      while(_g11 < s) {
        var q1 = _g11++;
        var a = x[q1 + s * p];
        var b = x[q1 + s * (p + m)];
        y[q1 + s * (2 * p)] = a.plus(b);
        y[q1 + s * (2 * p + 1)] = a.minus_bang(b).multi(wp);
      }
    }
    FFT.fft_(n / 2,2 * s,!eo,y,x);
  }
};
FFT.fft = function(x,n) {
  FFT.fft_(n,1,false,x,new Array());
};
var HxOverrides = function() { };
HxOverrides.iter = function(a) {
  return { cur : 0, arr : a, hasNext : function() {
    return this.cur < this.arr.length;
  }, next : function() {
    return this.arr[this.cur++];
  }};
};
var Lambda = function() { };
Lambda.fold = function(it,f,first) {
  var $it0 = $iterator(it)();
  while( $it0.hasNext() ) {
    var x = $it0.next();
    first = f(x,first);
  }
  return first;
};

var Pitcher = function() { };
Pitcher.parabola = function(nsdf,i) {
  var a = nsdf[i - 1];
  var b = nsdf[i];
  var c = nsdf[i + 1];
  var bottom = a + c - 2.0 * b;
  var x;
  var y;
  if(bottom == 0.0) {
    x = i;
    y = b;
  } else {
    var delta = a - c;
    x = i + delta / (2.0 * bottom);
    y = b - delta * delta / (8.0 * bottom);
  }
  return { x : x, y : y};
};
Pitcher.acf = function(x) {
  var n = x.length;
  var tmp = new Array();
  var _g = 0;
  while(_g < n) {
    var i = _g++;
    tmp[i] = x[i];
  }
  var _g1 = n;
  var _g2 = n * 2;
  while(_g1 < _g2) {
    var i1 = _g1++;
    tmp[i1] = new Complex(0,0);
  }
  FFT.fft(tmp,n * 2);
  var _g11 = 0;
  var _g3 = n * 2;
  while(_g11 < _g3) {
    var i2 = _g11++;
    tmp[i2] = tmp[i2].abs2();
  }
  FFT.fft(tmp,n * 2);
  var out = new Array();
  var _g4 = 0;
  while(_g4 < n) {
    var i3 = _g4++;
    out[i3] = tmp[i3].real / n / 2;
  }
  return out;
};
Pitcher.nsdf = function(x) {
  var sq = function(n) {
    return n * n;
  };
  var n1 = x.length;
  var out = Pitcher.acf(x);
  var tsq = out[0] * 2.0;
  var _g = 0;
  while(_g < n1) {
    var i = _g++;
    if(tsq > 0.0) out[i] = out[i] / tsq; else out[i] = 0.0;
    tsq -= sq(x[n1 - 1 - i].real) + sq(x[i].real);
  }
  return out;
};
Pitcher.picking = function(nsdf) {
  var maxI = 0;
  var nega = false;
  var peaks = new Array();
  var _g1 = 0;
  var _g = nsdf.length - 1;
  while(_g1 < _g) {
    var i = _g1++;
    if(nsdf[i] > 0.0) {
      if(nega && (maxI == 0 || nsdf[i] > nsdf[maxI])) maxI = i;
    } else {
      if(maxI > 0) {
        peaks.push(maxI);
        maxI = 0;
      }
      nega = true;
    }
  }
  if(maxI > 0) peaks.push(maxI);
  return peaks;
};
Pitcher.pitch = function(ary,sampleRate) {
  var DEFAULT_CUTOFF = 0.95;
  var x = new Array();
  var _g1 = 0;
  var _g = ary.length;
  while(_g1 < _g) {
    var i = _g1++;
    x[i] = new Complex(ary[i],0);
  }
  var nsdf = Pitcher.nsdf(x);
  var peaks = Pitcher.picking(nsdf);
  if(peaks.length == 0) return -1.0;
  var periods = new Array();
  var amps = new Array();
  var _g11 = 0;
  var _g2 = peaks.length;
  while(_g11 < _g2) {
    var i1 = _g11++;
    var h = Pitcher.parabola(nsdf,peaks[i1]);
    amps.push(h.y);
    periods.push(h.x);
  }
  var max = Lambda.fold(amps,function(e,max1) {
    if(e > max1) return e; else return max1;
  },0.0);
  if(max < 0.35) return -1.0;
  var coff = DEFAULT_CUTOFF * max;
  var idx = -1;
  var _g12 = 0;
  var _g3 = amps.length;
  while(_g12 < _g3) {
    var i2 = _g12++;
    if(amps[i2] > coff) {
      idx = i2;
      break;
    }
  }
  if(idx == -1) return -1.0;
  return sampleRate / periods[idx];
};

function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }

module.exports = Pitcher;
