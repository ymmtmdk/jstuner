import Complex from './complex';

class Pitcher{
  private static parabola(nsdf: Array<number>, i:number){
    const a = nsdf[i-1];
    const b = nsdf[i];
    const c = nsdf[i+1];

    const bottom = a + c - 2.0 * b;
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
    const n = x.length;
    const out = this.acf(x);
    let tsq = out[0]*2.0;
    for (let i = 0; i < n; i++){
      out[i] = tsq>0.0 ? out[i]/tsq : 0.0;
      tsq -= Math.pow(x[n-1-i].real, 2) + Math.pow(x[i].real, 2);
    }
    return out;
  }

  private static peakPicking(nsdf: Array<number>){
    let head = 0;
    const peakIndexes = new Array<number>();
    const n = nsdf.length - 1;
    let i = 0;
    for (; i < n && nsdf[i] > 0; i++){
      // nop
    }
    for (; i < n; i++){
      const pi = peakIndexes[head];
      if (nsdf[i] > 0){
        if (pi === undefined || nsdf[i] > nsdf[pi]){
          peakIndexes[head] = i;
        }
      }else if (pi !== undefined){
        head += 1;
      }
    }

    return peakIndexes;
  }

  static pitch(ary: Array<number>, sampleRate: number){
    const DEFAULT_CUTOFF = 0.95;

    const x = new Array<Complex>();
    for (let i = 0; i < ary.length; i++) x[i] = new Complex(ary[i], 0);

    const nsdf = this.nsdf(x);

    const peakIndexes = this.peakPicking(nsdf);
    if (peakIndexes.length === 0) return -1.0;

    const periods = new Array<number>();
    const amps = new Array<number>();

    let maxAmp = 0;
    for (let i = 0; i < peakIndexes.length; i++){
      const h = this.parabola(nsdf, peakIndexes[i]);
      maxAmp = Math.max(maxAmp, h.y);
      amps.push(h.y);
      periods.push(h.x);
    }

    if (maxAmp < 0.35) return -1.0;

    let idx = amps.findIndex(e=> e > DEFAULT_CUTOFF * maxAmp);
    if (idx === -1) return -1.0;

    return sampleRate / periods[idx];
  }
}

class FFT{
  private static fft_inner(n: number,stride: number,copy_flag: boolean,x: Array<Complex>,y: Array<Complex>) {
    if(n <= 1) {
      for (let q = 0; copy_flag && q < stride; q++){ y[q] = x[q]; }
      return;
    }

    const m = Math.floor(n/2);
    const theta = 2.0 * Math.PI / n;
    for (let p = 0; p < m; p++){
      const wp = new Complex(Math.cos(p * theta),-Math.sin(p * theta));
      for (let q = 0; q < stride; q++){
        const a = x[q + stride * p];
        const b = x[q + stride * (p + m)];
        y[q + stride * (2*p+0)] = a.plus(b);
        y[q + stride * (2*p+1)] = a.minus_bang(b).multi(wp);
      }
    }
    FFT.fft_inner(m, 2*stride, !copy_flag, y, x);
  }

  static fft(x: Array<Complex>, n: number) {
    FFT.fft_inner(n, 1, false, x, new Array<Complex>());
  }
}

export default Pitcher;

