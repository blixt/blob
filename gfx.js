var canvas = document.createElement('canvas');
canvas.width = '960';
canvas.height = '540';
document.body.appendChild(canvas);

var gfx = canvas.getContext('2d');

var mx = 0, my = 0;
document.addEventListener('mousemove', function (event) {
  mx = event.pageX;
  my = event.pageY;
});

var PI2 = Math.PI * 2;
function render() {
  gfx.clearRect(0, 0, 960, 540);

  /*
  gfx.strokeStyle = 'rgba(0, 0, 0, .3)';
  for (var i = 0; i < numParticles; i++) {
    var x = particlesX2[i], y = particlesY2[i];
    gfx.beginPath();
    gfx.moveTo(x + 3, y);
    gfx.arc(x, y, 3, 0, PI2, true);
    gfx.stroke();
  }
  */

  for (var i = 0, e = numConstraints * 4; i < e; i += 4) {
    var a = constraints[i],
        b = constraints[i + 1],
        hardness = constraints[i + 3];

    if (hardness < .1) continue;

    var x1 = particlesX2[a],
        y1 = particlesY2[a],
        x2 = particlesX2[b],
        y2 = particlesY2[b];

    gfx.strokeStyle = 'rgba(0, 200, 0, ' + hardness + ')';
    gfx.beginPath();
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.stroke();
  }

  for (var i = 0; i < numLines; i++) {
    var x1 = linesX1[i], y1 = linesY1[i],
        x2 = linesX2[i], y2 = linesY2[i],
        nx = linesNX[i], ny = linesNY[i],
        cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;

    gfx.strokeStyle = '#000';
    gfx.beginPath();
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.stroke();

    gfx.strokeStyle = '#00f';
    gfx.beginPath();
    gfx.moveTo(cx, cy);
    gfx.lineTo(cx + nx * 10, cy + ny * 10);
    gfx.stroke();
  }
}