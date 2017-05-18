import Complex from './complex';

class Pitcher{
  private static parabola(nsdf: Array<number>, i:number){
    const a = nsdf[i-1];
    const b = nsdf[i];
    const c = nsdf[i+1];

    const bottom = a + c - 2.0 * b;
    let x:number, y:number;
    if (bottom == 0.0){
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
    const out = this.acf(x);
    let tsq = out[0]*2.0;
    for (let i = 0; i < n; i++){
      out[i] = tsq>0.0 ? out[i]/tsq : 0.0;
      tsq -= sq(x[n-1-i].real) + sq(x[i].real);
    }
    return out;
  }

  private static peakPicking(nsdf: Array<number>){
    let maxI = 0;
    let nega = false;
    const peaks = new Array<number>();
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

    // const x2: Array<Complex> = ary.map((e)=>{return new Complex(e, 0)});
    const x = new Array<Complex>();
    for (let i = 0; i < ary.length; i++) x[i] = new Complex(ary[i], 0);

    const nsdf = this.nsdf(x);

    const peaks = this.peakPicking(nsdf);
    if (peaks.length === 0) return -1.0;

    const periods = new Array<number>();
    const amps = new Array<number>();

    for (let i = 0; i < peaks.length; i++){
      const h = this.parabola(nsdf, peaks[i]);
      amps.push(h.y);
      periods.push(h.x);
    }

    const max = amps.reduce((a,b)=>Math.max(a,b));

    if (max < 0.35) return -1.0;
    const coff = DEFAULT_CUTOFF * max;

    let idx = amps.findIndex(e=> e > coff);
    if (idx === -1) return -1.0;

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

export default Pitcher;

