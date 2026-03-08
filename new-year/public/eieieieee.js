const a = document.getElementById('canvas');
const ei = a.getContext('2d');
let eia = window.innerWidth;
let eieia = window.innerHeight;

a.width = eia;
a.height = eieia;

const _0 = [];
const _1 = [];

function _2(min, max) {
  return Math.random() * (max - min) + min;
}

class _4 {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    this.tx = tx;
    this.ty = ty;
    this.coords = [[x, y], [x, y], [x, y]];
    this.angle = Math.atan2(ty - y, tx - x);
    this.speed = 11.4514;
    this.acc = 1.14514;
    this.brightness = _2(50, 70);
    this.targetRadius = 1.14;
  }

  u(index) {
    this.coords.pop();
    this.coords.unshift([this.x, this.y]);
    this.speed *= this.acc;
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    const d = Math.sqrt(Math.pow(this.tx - this.x, 2) + Math.pow(this.ty - this.y, 2));

    if (d < this.speed) {
      _5(this.tx, this.ty);
      _0.splice(index, 1);
    } else {
      this.x += vx;
      this.y += vy;
    }
  }

  d() {
    ei.beginPath();
    ei.moveTo(this.coords[0][0], this.coords[0][1]);
    ei.lineTo(this.x, this.y);
    ei.strokeStyle = `hsl(${_2(0, 360)}, 100%, ${this.brightness}%)`;
    ei.stroke();
  }
}

class _6 {
  constructor(eeiaia, eeiaiaa) {
    this.eaeiei = eeiaia;
    this.eeiaia = eeiaiaa;
    this.eeiaiaaa = [[eeiaia, eeiaiaa], [eeiaia, eeiaiaa], [eeiaia, eeiaiaa]];
    this.eieieiiiia = _2(0, Math.PI * 2);
    this.eiaiaiiiaaiee = _2(1, 10);
    this.eiaieieiaii = 0.95;
    this.eieieeeiaa = 1;
    this.eia = _2(0, 360);
    this.eieieieiaa = _2(50, 80);
    this.eieieieee = 1;
    this.eeieieaaa = _2(0.015, 0.03);
  }

  u(index) {
    this.eeiaiaaa.pop();
    this.eeiaiaaa.unshift([this.eaeiei, this.eeiaia]);
    this.eiaiaiiiaaiee *= this.eiaieieiaii;
    this.eaeiei += Math.cos(this.eieieiiiia) * this.eiaiaiiiaaiee;
    this.eeiaia += Math.sin(this.eieieiiiia) * this.eiaiaiiiaaiee + this.eieieeeiaa;
    this.eieieieee -= this.eeieieaaa;

    if (this.eieieieee <= this.eeieieaaa) {
      _1.splice(index, 1);
    } else {
      this.d();
    }
  }

  d() {
    ei.beginPath();
    ei.moveTo(this.eeiaiaaa[0][0], this.eeiaiaaa[0][1]);
    ei.lineTo(this.eaeiei, this.eeiaia);
    ei.strokeStyle = `hsla(${this.eia}, 100%, ${this.eieieieiaa}%, ${this.eieieieee})`;
    ei.stroke();
  }
}

function _5(x, y) {
  let count = 30;
  while (count--) {
    _1.push(new _6(x, y));
  }
}

function _7() {
  requestAnimationFrame(_7);
  ei.globalCompositeOperation = 'destination-out';
  ei.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ei.fillRect(0, 0, eia, eieia);
  ei.globalCompositeOperation = 'lighter';

  let i = _0.length;
  while (i--) {
    _0[i].d();
    _0[i].u(i);
  }

  let j = _1.length;
  while (j--) {
    _1[j].u(j);
  }

  if (Math.random() < 0.05) {
    _0.push(new _4(eia / 2, eieia, _2(0, eia), _2(0, eieia / 2)));
  }
}

_7();
