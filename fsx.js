var GRAVITY = 0.1;
var MAX_PARTICLES = 1024;

var constraints = [];
var particlesX1 = new Float64Array(MAX_PARTICLES),
    particlesY1 = new Float64Array(MAX_PARTICLES),
    particlesX2 = new Float64Array(MAX_PARTICLES),
    particlesY2 = new Float64Array(MAX_PARTICLES);

var numConstraints = 0,
    numParticles = 0;

// Create a constraint between each index specified. Make the last value `true'
// if the constraints should be created between all particles in the set,
// rather than in a sequence.
function constrain(var_args) {
  var length = arguments.length;

  var all = arguments[length - 1];
  if (typeof all == 'boolean') {
    length--;
  } else {
    all = false;
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
        constrain(value, arguments[j]);
      }
    } else {
      if (i > 0) {
        constraints.push(previous, value, distance(previous, value));
        numConstraints++;
      }
      previous = value;
    }
  }
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

function step() {
  var i, e;

  for (i = 0, e = numConstraints * 3; i < e; i += 3) {
    var a = constraints[i],
        b = constraints[i + 1],
        rest = constraints[i + 2];

    var dx = particlesX2[a] - particlesX2[b],
        dy = particlesY2[a] - particlesY2[b],
        dist = Math.sqrt(dx * dx + dy * dy),
        diff = (rest - dist) / dist,
        tx = dx / 2 * diff,
        ty = dy / 2 * diff;

    particlesX2[a] += tx;
    particlesY2[a] += ty;
    particlesX2[b] -= tx;
    particlesY2[b] -= ty;
  }

  for (i = 0; i < numParticles; i++) {
    particlesX1[i] = particlesX2[i] * 2 - particlesX1[i];

    var newY = particlesY2[i] * 2 - particlesY1[i] + GRAVITY;
    particlesY1[i] = newY > 520 ? 520 : newY;
  }

  var t;
  t = particlesX1;
  particlesX1 = particlesX2;
  particlesX2 = t;
  t = particlesY1;
  particlesY1 = particlesY2;
  particlesY2 = t;
}