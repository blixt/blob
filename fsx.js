var GRAVITY = .1;
var MAX_LINES = 128;
var MAX_PARTICLES = 1024;

var constraints = [];

var linesX1 = new Float64Array(MAX_LINES),
    linesY1 = new Float64Array(MAX_LINES),
    linesX2 = new Float64Array(MAX_LINES),
    linesY2 = new Float64Array(MAX_LINES),
    linesNX = new Float64Array(MAX_LINES),
    linesNY = new Float64Array(MAX_LINES),
    linesFriction = new Float64Array(MAX_LINES);

var particlesX1 = new Float64Array(MAX_PARTICLES),
    particlesY1 = new Float64Array(MAX_PARTICLES),
    particlesX2 = new Float64Array(MAX_PARTICLES),
    particlesY2 = new Float64Array(MAX_PARTICLES);

var numConstraints = 0,
    numLines = 0,
    numParticles = 0;

// constrain(p1, p2, p3, …[, all[, hardness]])
// number pN: particle index
// boolean all: create constraints between ALL particles in list instead of
//              sequence
// number hardness: how soft/hard constraint is (0.0–1.0)
function constrain(var_args) {
  if (Array.isArray(var_args)) {
    return constrain.apply(null, var_args.concat(Array.prototype.slice.call(arguments, 1)));
  }

  var length = arguments.length;

  var all = arguments[length - 2], hardness;
  if (typeof all == 'boolean') {
    hardness = arguments[length - 1];
    length -= 2;
  } else {
    hardness = 1;
    all = arguments[length - 1];
    if (typeof all == 'boolean') {
      length--;
    } else {
      all = false;
    }
  }

  if (length < 2)
    throw new Error('Need to constrain at least two particles');

  var previous;
  for (var i = 0; i < length; i++) {
    var value = arguments[i];

    if (typeof value != 'number')
      throw new Error('Invalid value in constrain()');

    if (all) {
      for (var j = i + 1; j < length; j++) {
        constrain(value, arguments[j], false, hardness);
      }
    } else {
      if (i > 0) {
        constraints.push(previous, value, distance(previous, value), hardness);
        numConstraints++;
      }
      previous = value;
    }
  }
}

function createBlob(x, y, radius, opt_points, opt_vx, opt_vy) {
  var n = opt_points || 9;

  if (n < 3)
    throw new Error('At least three points are required');

  var angleStep = Math.PI * 2 / n;
  var particles = [];
  for (var i = 0; i < n; i++) {
    var p = createParticle(x + Math.cos(i * angleStep) * radius,
                           y + Math.sin(i * angleStep) * radius,
                           opt_vx, opt_vy);
    particles.push(p);
  }

  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      var neighbor = (j == i + 1 || i == 0 && j == n - 1);
      constrain(particles[i], particles[j], false, neighbor ? 1 : .03);
    }
  }
}

function createLine(x1, y1, x2, y2, opt_friction) {
  linesX1[numLines] = x1;
  linesY1[numLines] = y1;
  linesX2[numLines] = x2;
  linesY2[numLines] = y2;

  var dx = x2 - x1, dy = y2 - y1;
  var length = Math.sqrt(dx * dx + dy * dy);
  linesNX[numLines] = dy / length;
  linesNY[numLines] = -dx / length;
  linesFriction[numLines] = opt_friction || .2;

  return numLines++;
}

function createParticle(x, y, opt_vx, opt_vy) {
  if (numParticles >= MAX_PARTICLES)
    throw new Error('Tried to exceed MAX_PARTICLES');

  particlesX1[numParticles] = x - (opt_vx || 0);
  particlesY1[numParticles] = y - (opt_vy || 0);
  particlesX2[numParticles] = x;
  particlesY2[numParticles] = y;

  return numParticles++;
}

function distance(a, b) {
  var dx = particlesX2[a] - particlesX2[b],
      dy = particlesY2[a] - particlesY2[b];
  return Math.sqrt(dx * dx + dy * dy);
}

function line2line(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  var adx = ax2 - ax1, ady = ay2 - ay1,
      bdx = bx2 - bx1, bdy = by2 - by1,
      abx1 = ax1 - bx1, aby1 = ay1 - by1;

  var d = bdy * adx - bdx * ady;
  if (d == 0) {
    return false;
  }

  var ua = (bdx * aby1 - bdy * abx1) / d;
  var ub = (adx * aby1 - ady * abx1) / d;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  return ua;
}

var MOVE_DX, MOVE_DY;
function move(x, y, dx, dy) {
  for (var i = 0; i < numLines; i++) {
    var lx1 = linesX1[i], ly1 = linesY1[i],
        lx2 = linesX2[i], ly2 = linesY2[i],
        lnx = linesNX[i], lny = linesNY[i],
        ldx = lx2 - lx1, ldy = ly2 - ly1;

    var d = lx1 * lnx + ly1 * lny;

    var startDist = x * lnx + y * lny - d;
    if (startDist < 0) {
      lnx = -lnx;
      lny = -lny;
      d = -d;
    }

    var endDist = (x + dx) * lnx + (y + dy) * lny - d;
    if (endDist < 0) {
      var u = (dx * (y - ly1) - dy * (x - lx1)) / (ldy * dx - ldx * dy);
      if (u > 0 && u < 1) {
        var friction = linesFriction[i];
        var slideX = x + dx - (lx1 + ldx * u), slideY = y + dy - (ly1 + ldy * u);
        dx += lnx * (-endDist + 0.001) - slideX * friction;
        dy += lny * (-endDist + 0.001) - slideY * friction;
      }
    }
  }

  MOVE_DX = dx;
  MOVE_DY = dy;
}

function step() {
  var i, e;

  for (i = 0, e = numConstraints * 4; i < e; i += 4) {
    var a = constraints[i],
        b = constraints[i + 1],
        rest = constraints[i + 2],
        hardness = constraints[i + 3];

    var ax = particlesX2[a],
        ay = particlesY2[a],
        bx = particlesX2[b],
        by = particlesY2[b],
        dx = ax - bx,
        dy = ay - by,
        dist = Math.sqrt(dx * dx + dy * dy),
        diff = (rest - dist) / dist * hardness,
        tx = dx / 2 * diff,
        ty = dy / 2 * diff;

    move(ax, ay, tx, ty);
    particlesX2[a] += MOVE_DX;
    particlesY2[a] += MOVE_DY;
    move(bx, by, -tx, -ty);
    particlesX2[b] += MOVE_DX;
    particlesY2[b] += MOVE_DY;
  }

  for (i = 0; i < numParticles; i++) {
    var x1 = particlesX1[i], y1 = particlesY1[i],
        x2 = particlesX2[i], y2 = particlesY2[i];

    var dx = (x2 - x1) * 2,
        dy = (y2 - y1) * 2 + GRAVITY;

    move(x1, y1, dx, dy);
    particlesX1[i] += MOVE_DX;
    particlesY1[i] += MOVE_DY;
  }

  var t;
  t = particlesX1;
  particlesX1 = particlesX2;
  particlesX2 = t;
  t = particlesY1;
  particlesY1 = particlesY2;
  particlesY2 = t;
}