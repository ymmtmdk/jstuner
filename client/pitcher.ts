import Complex from './complex';

class Pitcher{
  private static parabola(nsdf: Array<number>, i:number){
    const a:number = nsdf[i-1];
    const b:number = nsdf[i];
    const c:number = nsdf[i+1];

    const bottom:number = a + c - 2.0 * b;
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

  private static acf(x: Array<Complex>){
    const n = x.length;
    const tmp = new Array<Complex>();
    for (let i = 0; i < n; i++){tmp[i] = x[i];}
    for (let i = n; i < (n*2); i++){tmp[i] = new Complex(0,0);}

    FFT.fft(tmp, n*2);
    for (let i = 0; i < (n*2); i++){tmp[i] = tmp[i].abs2();}

    FFT.fft(tmp, n*2);
    const out = new Array<number>();
    for (let i = 0; i < n; i++){out[i] = tmp[i].real/n/2;}
    return out;
  }

  private static nsdf(x: Array<Complex>){
    function sq(n:number){ return n*n;}

    const n = x.length;
    var out = this.acf(x);
    var tsq = out[0]*2.0;
    for (let i = 0; i < n; i++){
      out[i] = tsq>0.0 ? out[i]/tsq : 0.0;
      tsq -= sq(x[n-1-i].real) + sq(x[i].real);
    }
    return out;
  }

  private static picking(nsdf: Array<number>){
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

  static pitch(ary: Array<number>, sampleRate: number){
    const DEFAULT_CUTOFF = 0.95;

    const x = new Array<Complex>();
    for (let i = 0; i < ary.length; i++) x[i] = new Complex(ary[i], 0);

    const nsdf = this.nsdf(x);

    const peaks = this.picking(nsdf);
    if (peaks.length == 0) return -1.0;

    const periods = new Array<number>();
    const amps = new Array<number>();

    for (let i = 0; i < peaks.length; i++){
      var h = this.parabola(nsdf, peaks[i]);
      amps.push(h.y);
      periods.push(h.x);
    }

    const max = Lambda.fold(amps, function(e, max){return e > max ? e : max;}, 0.0);

    if (max < 0.35) return -1.0;
    const coff = DEFAULT_CUTOFF * max;

    let idx = -1;
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
  private static fft_inner = function(n: number,s: number,copy_flag: boolean,x: Array<Complex>,y: Array<Complex>) {
    if(n == 1) {
      if(copy_flag) {
        for (let q = 0; q < s; q++){ y[q] = x[q]; }
      }
      return;
    }

    const m = Math.floor(n / 2);
    const theta = 2.0 * Math.PI / n;
    for (let p = 0; p < m; p++){
      const wp = new Complex(Math.cos(p * theta),-Math.sin(p * theta));
      for (let q = 0; q < s; q++){
        const a = x[q + s * p];
        const b = x[q + s * (p + m)];
        y[q + s * (2 * p)] = a.plus(b);
        y[q + s * (2 * p + 1)] = a.minus_bang(b).multi(wp);
      }
    }
    FFT.fft_inner(n / 2, 2 * s, !copy_flag, y, x);
  }

  static fft = function(x,n) {
    FFT.fft_inner(n,1,false,x,new Array());
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

