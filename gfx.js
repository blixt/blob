var canvas = document.createElement('canvas');
canvas.width = '960';
canvas.height = '540';
document.body.appendChild(canvas);

var gfx = canvas.getContext('2d');

var PI2 = Math.PI * 2;
function render() {
  gfx.clearRect(0, 0, 960, 540);
  gfx.strokeStyle = 'rgba(0, 0, 255, .2)';

  for (var i = 0, e = numConstraints * 3; i < e; i += 3) {
    var a = constraints[i],
        b = constraints[i + 1];

    var x1 = particlesX2[a],
        y1 = particlesY2[a],
        x2 = particlesX2[b],
        y2 = particlesY2[b];

    gfx.beginPath();
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.stroke();
  }

  for (var i = 0; i < numParticles; i++) {
    var x = particlesX2[i], y = particlesY2[i];
    gfx.beginPath();
    gfx.moveTo(x + 5, y);
    gfx.arc(x, y, 5, 0, PI2, true);
    gfx.stroke();
  }
}