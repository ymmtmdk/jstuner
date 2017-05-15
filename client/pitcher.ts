import Complex from './complex';

class Pitcher{
  static parabola(nsdf: Array<number>, i:number){
    var a:number = nsdf[i-1];
    var b:number = nsdf[i];
    var c:number = nsdf[i+1];

    var bottom:number = a + c - 2.0 * b;
    var x:number, y:number;
    if (bottom == 0.0){
      x = i;
      y = b;
    }else{
      var delta = a - c;
      x = i + delta / (2.0 * bottom);
      y = b - delta * delta / (8.0 * bottom);
    }
    return {x:x, y:y};
  }

  static acf(x: Array<Complex>){
    var n = x.length;
    var tmp = new Array<Complex>();
    for (let i = 0; i < n; i++){tmp[i] = x[i];}
    for (let i = n; i < (n*2); i++){tmp[i] = new Complex(0,0);}

    FFT.fft(tmp, n*2);
    for (let i = 0; i < (n*2); i++){tmp[i] = tmp[i].abs2();}

    FFT.fft(tmp, n*2);
    var out = new Array<number>();
    for (let i = 0; i < n; i++){out[i] = tmp[i].real/n/2;}
    return out;
  }

  static nsdf(x: Array<Complex>){
    function sq(n:number){ return n*n;}

    var n = x.length;
    var out = this.acf(x);
    var tsq = out[0]*2.0;
    for (let i = 0; i < n; i++){
      out[i] = tsq>0.0 ? out[i]/tsq : 0.0;
      tsq -= sq(x[n-1-i].real) + sq(x[i].real);
    }
    return out;
  }

  static picking(nsdf: Array<number>){
    var maxI = 0;
    var nega = false;
    var peaks = new Array<number>();
    for (let i = 0; i < nsdf.length-1; i++){
      if (nsdf[i] > 0.0){
        if (nega && (maxI==0 || nsdf[i]>nsdf[maxI])) maxI = i;
      }else{
        if (maxI>0){
          peaks.push(maxI);
          maxI = 0;
        }
        nega = true;
      }
    }
    if (maxI>0) peaks.push(maxI);

    return peaks;
  }

  public static pitch(ary: Array<number>, sampleRate: number){
    var DEFAULT_CUTOFF = 0.95;

    var x = new Array<Complex>();
    for (let i = 0; i < ary.length; i++) x[i] = new Complex(ary[i], 0);

    var nsdf = nsdf(x);

    var peaks = this.picking(nsdf);
    if (peaks.length == 0) return -1.0;

    var periods = new Array<number>();
    var amps = new Array<number>();

    for (let i = 0; i < peaks.length; i++){
      var h = this.parabola(nsdf, peaks[i]);
      amps.push(h.y);
      periods.push(h.x);
    }

    var max = Lambda.fold(amps, function(e, max){return e > max ? e : max;}, 0.0);

    if (max < 0.35) return -1.0;
    var coff = DEFAULT_CUTOFF * max;

    var idx = -1;
    for (let i = 0; i < amps.length; i++){
      if (amps[i] > coff){
        idx = i;
        break;
      }
    }

    if (idx == -1) return -1.0;

    return sampleRate / periods[idx];
  }
}

class FFT{
  static fft_ = function(n,s,eo,x,y) {
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
  }

  static fft = function(x,n) {
    FFT.fft_(n,1,false,x,new Array());
  }
}

class HxOverrides{
  static iter(a) {
    return { cur : 0, arr : a, hasNext : function() {
      return this.cur < this.arr.length;
    }, next : function() {
      return this.arr[this.cur++];
    }};
  }
}

class Lambda{
  static fold(it,f,first) {
    var $it0 = $iterator(it)();
    while( $it0.hasNext() ) {
      var x = $it0.next();
      first = f(x,first);
    }
    return first;
  }
}

function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;

function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }

export default Pitcher;

