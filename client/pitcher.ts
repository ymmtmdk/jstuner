import Complex from './complex';

class Pitcher{
  private static parabola(nsdf: Array<number>, i:number){
    const a:number = nsdf[i-1];
    const b:number = nsdf[i];
    const c:number = nsdf[i+1];

    const bottom:number = a + c - 2.0 * b;
    let x:number, y:number;
    if (bottom === 0.0){
      x = i;
      y = b;
    }else{
      const delta = a - c;
      x = i + delta / (2.0 * bottom);
      y = b - delta * delta / (8.0 * bottom);
    }
    return {x:x, y:y};
  }

  private static acf(x: Array<Complex>){
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

  private static nsdf(x: Array<Complex>){
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

  private static picking(nsdf: Array<number>){
    var maxI = 0;
    var nega = false;
    var peaks = new Array<number>();
    for (let i = 0; i < nsdf.length-1; i++){
      if (nsdf[i] > 0.0){
	if (nega && (maxI===0 || nsdf[i]>nsdf[maxI])) maxI = i;
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

    // const x2: Array<Complex> = ary.map((e)=>{return new Complex(e, 0)});
    const x = new Array<Complex>();
    for (let i = 0; i < ary.length; i++) x[i] = new Complex(ary[i], 0);

    const nsdf = this.nsdf(x);

    const peaks = this.picking(nsdf);
    if (peaks.length === 0) return -1.0;

    const periods = new Array<number>();
    const amps = new Array<number>();

    for (let i = 0; i < peaks.length; i++){
      var h = this.parabola(nsdf, peaks[i]);
      amps.push(h.y);
      periods.push(h.x);
    }

    const max = amps.reduce((a,b)=>Math.max(a,b));

    if (max < 0.35) return -1.0;
    const coff = DEFAULT_CUTOFF * max;

    let idx = amps.find(e=> e > coff);-1;
    if (idx === undefined) return -1.0;

    return sampleRate / periods[idx];
  }
}

class FFT{
  private static fft_ = function(n: number, s: number, eo: boolean, x: Array<Complex>, y: Array<Complex>) {
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
	  var a: Complex = x[q1 + s * p];
	  var b: Complex = x[q1 + s * (p + m)];
	  y[q1 + s * (2 * p)] = a.plus(b);
	  y[q1 + s * (2 * p + 1)] = a.minus_bang(b).multi(wp);
	}
      }
      FFT.fft_(n / 2,2 * s,!eo,y,x);
    }
  }

  static fft = function(x: Array<Complex>, n: number) {
    FFT.fft_(n,1,false,x,new Array<Complex>());
  }
}

export default Pitcher;

