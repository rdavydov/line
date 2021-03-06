/**
 * SegmentList keeps track of the points of a line in different layers
 */
"use strict";

var _get = function get(_x91, _x92, _x93) { var _again = true; _function: while (_again) { var object = _x91, property = _x92, receiver = _x93; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x91 = parent; _x92 = property; _x93 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SegmentList = (function () {
  function SegmentList() {
    var layers = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    _classCallCheck(this, SegmentList);

    this.layerCount = layers;
    this.layers = [];

    this.segmentCount = 0;
    this.reset();
  }

  _createClass(SegmentList, [{
    key: "reset",
    value: function reset() {
      for (var i = 0; i < this.layerCount; i++) {
        this.layers[i] = [[], []];
      }
      this.segmentCount = 0;
    }
  }, {
    key: "add",
    value: function add(i, p1, p2) {
      this.layers[i][0].push(p1);
      this.layers[i][1].unshift(p2);

      this.segmentCount++;
    }
  }, {
    key: "join",
    value: function join(which) {
      return this.layers[which][0].concat(this.layers[which][1]);
    }
  }]);

  return SegmentList;
})();

var LineForm = (function (_Form) {
  _inherits(LineForm, _Form);

  function LineForm() {
    _classCallCheck(this, LineForm);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(LineForm.prototype), "constructor", this).apply(this, args);
  }

  /**
   * This is the base for all experimental line classes
   * It's a Pt.Curve and define basic functions for drawing a line and responding to mouse and touch events
   */

  _createClass(LineForm, [{
    key: "_getSegmentDistance",
    value: function _getSegmentDistance(last, curr) {
      return last && curr ? curr.distance(last) : 0;
    }

    /**
     * Get a normal line (which cuts cross two points) from an interpolated point of the two points
     * @param last Point 1
     * @param curr Point 2
     * @param dist distance of the line
     * @param t interpolate value (0 to 1), defaults to middle (0.5)
     * @param distRatio scale factor of the distance, defaults to 1
     * @returns {{p1: *, p2: *}}
     * @private
     */
  }, {
    key: "_getSegmentNormal",
    value: function _getSegmentNormal(last, curr, dist) {
      var t = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];
      var distRatio = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      if (last) {
        var ln = new Line(last).to(curr);
        var dr1 = distRatio != null ? distRatio : 1;
        var dr2 = distRatio != null ? 1 - distRatio : 1;
        return { p1: ln.getPerpendicular(t, dist * dr1).p1, p2: ln.getPerpendicular(t, dist * dr2, true).p1 };
      } else {
        return { p1: curr.clone(), p2: curr.clone() };
      }
    }

    /**
     * Draw noise polygons
     * @param noise noise instance (seeded)
     * @param noiseIncrement noise value addition
     * @param dist thickness of brush
     * @param layerRatio a ratio based on current-layer / total-layers
     * @param magnify magnification ratio
     */
  }, {
    key: "_getNoiseDistance",
    value: function _getNoiseDistance(noise, noiseIncrement, dist, layerRatio) {
      var magnify = arguments.length <= 4 || arguments[4] === undefined ? 3 : arguments[4];

      // noise parameters
      var na = layerRatio;
      var nb = 1 - layerRatio;

      // get next noise
      var layerset = noise.simplex2d(na + noiseIncrement, nb + noiseIncrement);
      return dist * layerset * (0.5 + magnify * layerRatio);
    }

    /**
     * Given an array of latest values, get the average value and update the array with fresh values
     * @param bufferList an array to hold the latest values
     * @param curr current value to add to array
     * @param max maxmium number of items in the array
     * @returns average number
     * @private
     */
  }, {
    key: "_smooth",
    value: function _smooth(bufferList, curr, max) {
      bufferList.push(curr);
      if (bufferList.length > max) bufferList.shift();
      var avg = bufferList.reduce(function (a, b) {
        return a + b;
      }, 0);
      return avg / bufferList.length;
    }

    /**
     * Draw dotted lines
     * @param pts points list
     * @param subdivision how many extra dots per line segments
     * @param largeSize size of vertex
     * @param smallSize size of interpolated points
     * @param asCircle if `true`, draw point as circle. if `false`, draw point as rectangle.
     */
  }, {
    key: "dottedLine",
    value: function dottedLine(pts) {
      var subdivision = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];
      var largeSize = arguments.length <= 2 || arguments[2] === undefined ? 2 : arguments[2];
      var smallSize = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];
      var asCircle = arguments.length <= 4 || arguments[4] === undefined ? true : arguments[4];

      this.points(pts, largeSize, asCircle);

      var last = pts[0];
      for (var i = 0; i < pts.length; i++) {
        var ln = new Line(pts[i]).to(last);
        var lps = ln.subpoints(subdivision);
        this.points(lps, smallSize);
        last = new Vector(ln);
      }
    }

    /**
     * Draw polygons based on "speed
     * @param pts points list
     * @param distRatio distance scaling ratio, defaults to 0.5
     * @param maxDist maximum distance
     */
  }, {
    key: "speedLine",
    value: function speedLine(pts) {
      var distRatio = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
      var maxDist = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      var last = null;

      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        var normal = this._getSegmentNormal(last, vec, dist);
        last = vec.clone();

        // draw normal lines
        this.line(new Line(normal.p1).to(normal.p2));
      }
    }

    /**
     * Draw a line with arcs tracing around its points
     * @param pts points list
     * @param distRatio distance scaling ratio, defaults to 0.5
     * @param maxDist maximum distance
     * @param repeats number of arcs to draw around the point
     * @param startAngle start angle of the arc
     */
  }, {
    key: "arcLine",
    value: function arcLine(pts) {
      var distRatio = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
      var maxDist = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
      var repeats = arguments.length <= 3 || arguments[3] === undefined ? 7 : arguments[3];
      var startAngle = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

      var last = null;

      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);

        // draw normal lines
        if (last != null) {

          var gap = dist / 3;
          var r = Math.PI / 8;

          for (var n = 1; n < repeats; n++) {
            var offset = n / 10 + 2 * i / pts.length + startAngle;
            var circle = new Circle(vec.$subtract(last).divide(2).add(last)).setRadius(gap * n + gap);
            var d = n % 2 == 0 ? offset : -offset;
            d *= i * Const.one_degree;
            this.arc(circle, d, d + r);
          }
        }

        last = vec.clone();
        //this.line( new Line(normal.p1).to(normal.p2));
      }
    }

    /**
     * Draw a line that composes of "overshooting" straight line segments
     * @param pts points list
     * @param lastPts last points list (for calculations)
     */
  }, {
    key: "growLine",
    value: function growLine(pts, lastPts) {
      var speed = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];

      var last = pts[0] || new Vector();

      for (var i = 0; i < pts.length; i++) {
        if (lastPts[i]) {
          pts[i].z += 1; // use z for count

          var ln = new Line(last).to(pts[i]);
          var ip = ln.interpolate(Math.min(30, pts[i].z) / speed);
          this.line(new Line(last).to(ip));

          last = pts[i];
        }

        lastPts[i] = pts[i];
      }
    }

    /**
     * A line with perpendicular lines that cuts across it in an expanding zigzag pattern
     * @param pts points list
     * @param lastPts last points list (for calculations)
     * @param speed number of cycles to finish the expanding perpendicular lines
     */
  }, {
    key: "jaggedLine",
    value: function jaggedLine(pts, lastPts) {
      var speed = arguments.length <= 2 || arguments[2] === undefined ? 40 : arguments[2];
      var division = arguments.length <= 3 || arguments[3] === undefined ? 10 : arguments[3];

      var last = pts[0] || new Vector();
      var halfSpeed = speed / 2;

      for (var i = 0; i < pts.length; i++) {
        if (lastPts[i]) {

          pts[i].z += 1; // use z for count
          var dist = this._getSegmentDistance(last, pts[i], i) * 1;

          for (var s = 0; s < division; s++) {
            var ds = s / division;
            var normal = this._getSegmentNormal(last, pts[i], dist * Math.min(speed, pts[i].z) / halfSpeed, ds, Math.abs(ds - 0.5));

            var ln = new Line(normal.p1).to(normal.p2);
            ln.to(ln.midpoint());
            this.line(ln);
          }

          last = pts[i];
        }

        lastPts[i] = pts[i];
      }
    }

    /**
     * A line that's complemented by another curve that zigzags around it
     * @param pts points list
     * @param distRatio last points list (for calculations)
     * @param maxDist maximum distance
     */
  }, {
    key: "zigZagLine",
    value: function zigZagLine(pts) {
      var distRatio = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
      var maxDist = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      var last = null;
      var zz = [];

      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);

        if (!last) last = vec.clone();
        var ln = new Line(last).to(vec);
        zz.push(ln.getPerpendicular(0, dist, i % 2 === 0).p1);

        last = vec.clone();
      }

      this.polygon(new Curve().to(zz).catmullRom(5), false, false);
    }

    /**
     * A line complemented by variations of its restatements
     * @param pts points list
     */
  }, {
    key: "restatedLine",
    value: function restatedLine(pts) {

      var c1 = [];
      var c2 = [];
      var c3 = [];

      for (var i = 0; i < pts.length; i++) {
        if (i % 3 === 0) {
          c1.push(pts[i]);
        } else if (i % 3 === 1) {
          c2.push(pts[i]);
        } else {
          c3.push(pts[i]);
        }
      }
      this.polygon(new Curve().to(c1).cardinal(5, 0.6), false, false);
      this.polygon(new Curve().to(c2).cardinal(5, 0.45), false, false);
      this.polygon(new Curve().to(c3).bspline(5), false, false);
    }

    /**
     * A line whose path is shaped by small curved hatchings
     * @param pts points list
     * @param gap gap distance between hatchings, defaults to 3
     */
  }, {
    key: "hatchingLine",
    value: function hatchingLine(pts) {
      var gap = arguments.length <= 1 || arguments[1] === undefined ? 3 : arguments[1];

      var ps1 = [];
      var ps2 = [];
      var ps3 = [];

      for (var i = 0; i < pts.length; i++) {
        var d1 = i % gap;
        var d2 = i % (gap * 2);
        var d3 = i % (gap * 3);

        var p1 = pts[i];
        var p2 = ps1[d1] || ps1[i];
        var p3 = ps2[d2] || ps2[d1] || ps2[i];
        var p4 = ps3[d3] || ps3[d2] || ps3[d1] || ps3[i];

        if (p4 && p3 && p2 && p1) {
          this.curve(new Curve().to([p4, p3, p2, p1]).bspline(10));
        }

        ps3[d3] = ps2[d2];
        ps2[d2] = ps1[d1];
        ps1[d1] = pts[i];
      }
    }

    /**
     * A brushstroke created by stripes of thin lines
     * @param pts points list
     * @param nums number of inner lines
     * @param distRatio distance scaling ratio, defaults to 0.5
     * @param smoothSteps number of steps for the smoothing function. defaults to 3.
     * @param maxDist maximum distance
     */
  }, {
    key: "innerLine",
    value: function innerLine(pts) {
      var nums = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];
      var distRatio = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];
      var smoothSteps = arguments.length <= 3 || arguments[3] === undefined ? 3 : arguments[3];
      var maxDist = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];
      var skip = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];

      var last = null;
      var normals = [];
      var distSteps = [];

      // init normal arrays
      for (var n = 0; n < nums; n++) {
        normals[n] = [];
      }

      for (var i = skip; i < pts.length - skip; i++) {
        var vec = new Vector(pts[i]);

        if (!last) {
          last = vec.clone();
          continue;
        }

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = this._smooth(distSteps, dist, smoothSteps);

        var normal = this._getSegmentNormal(last, vec, dist);
        last = vec.clone();

        var subs = new Line(normal.p1).to(normal.p2).subpoints(nums);
        for (n = 0; n < nums; n++) {
          normals[n].push(subs[n]);
        }
      }

      for (n = 0; n < nums; n++) {
        this.polygon(normals[n], false, false);
      }
    }

    /**
     * A flat brushstroke created by stripes of thin lines moving in waves
     * @param pts points list
     * @param nums number of inner lines
     * @param thickness thickness of the brushstroke
     * @param wiggle an object { angle, step } which specifies the current angle and step for wave movement
     * @param distRatio distance scaling function
     * @param smoothSteps number of steps for the smoothing function. defaults to 3.
     * @param maxDist maximum distance
     */
  }, {
    key: "innerWiggleLine",
    value: function innerWiggleLine(pts) {
      var nums = arguments.length <= 1 || arguments[1] === undefined ? 5 : arguments[1];
      var thickness = arguments.length <= 2 || arguments[2] === undefined ? 100 : arguments[2];
      var wiggle = arguments.length <= 3 || arguments[3] === undefined ? { angle: 0, step: 0.01 } : arguments[3];
      var distRatio = arguments.length <= 4 || arguments[4] === undefined ? 0.5 : arguments[4];
      var smoothSteps = arguments.length <= 5 || arguments[5] === undefined ? 3 : arguments[5];
      var maxDist = arguments.length <= 6 || arguments[6] === undefined ? 0 : arguments[6];

      var last = null;
      var normals = [];
      var distSteps = [];

      // init normal arrays
      for (var n = 0; n < nums; n++) {
        normals[n] = [];
      }

      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        if (!last) {
          last = vec.clone();
          continue;
        }

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = thickness - Math.max(10, Math.min(thickness, dist));
        dist = this._smooth(distSteps, dist, smoothSteps);

        var w = (Math.sin(wiggle.angle + wiggle.step * i) + 1) / 2;

        var normal = this._getSegmentNormal(last, vec, dist, 0.5, w);
        last = vec.clone();

        var subs = new Line(normal.p1).to(normal.p2).subpoints(nums);
        for (n = 0; n < nums; n++) {
          normals[n].push(subs[n]);
        }
      }

      for (n = 0; n < nums; n++) {
        this.polygon(normals[n], false, false);
      }
    }

    /**
     * Draw a polygonal brushstroke that's based on the distanced travelled between segments (speed)
     * @param pts points list
     * @param flipSpeed a value to invert the distance-to-thickness calculation. Either 0 or specifies a max distance.
     * @param distRatio distance scaling factor
     * @param smoothSteps number of steps for the smoothing function. defaults to 3.
     * @param maxDist maximum distance
     */
  }, {
    key: "speedPolygon",
    value: function speedPolygon(pts) {
      var flipSpeed = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var distRatio = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];
      var smoothSteps = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];
      var maxDist = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

      var last = null;
      var lastNormal = { p1: false, p2: false };
      var distSteps = [];

      // go through each points
      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = flipSpeed > 0 ? flipSpeed - Math.min(flipSpeed, dist) : dist;
        dist = this._smooth(distSteps, dist, smoothSteps);

        var normal = this._getSegmentNormal(last, vec, dist);
        last = vec.clone();

        // draw polygon (quad)
        this.polygon([lastNormal.p1, lastNormal.p2, normal.p2, normal.p1]);
        lastNormal = normal;
      }
    }

    /**
     * Draw simplex noise polygons
     * @param pts points list
     * @param noise noise instance (seeded)
     * @param nf noise factors { a: current noise value, b: noise scale for layer index, c: noise scale for point index }
     * @param flipSpeed flip thickness (0 or a value that specifies max distance, such as 10)
     * @param distRatio distance ratio (0.5)
     * @param smoothSteps number of steps per average
     * @param maxDist maximum distance
     * @param layers number of layers
     * @param magnify magnification ratio
     * @param curveSegments number of segments for curve, or 0 for no curve
     */
  }, {
    key: "noisePolygon",
    value: function noisePolygon(pts, noise) {
      var nf = arguments.length <= 2 || arguments[2] === undefined ? { a: 0, b: 0.005, c: 0.005 } : arguments[2];
      var flipSpeed = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
      var distRatio = arguments.length <= 4 || arguments[4] === undefined ? 0.5 : arguments[4];
      var smoothSteps = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
      var maxDist = arguments.length <= 6 || arguments[6] === undefined ? 0 : arguments[6];
      var layers = arguments.length <= 7 || arguments[7] === undefined ? 15 : arguments[7];
      var magnify = arguments.length <= 8 || arguments[8] === undefined ? 3 : arguments[8];
      var curveSegments = arguments.length <= 9 || arguments[9] === undefined ? 0 : arguments[9];

      var last = null;
      var distSteps = [];

      // segment list keeps track of the points (a simplified convex hull)
      var segs = new SegmentList(layers);

      // go through each points
      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = flipSpeed > 0 ? flipSpeed - Math.min(flipSpeed, dist) : dist;
        dist = this._smooth(distSteps, dist, smoothSteps);

        // noise segments for each layer
        for (var n = 1; n < layers; n++) {
          var nfactors = nf.a + n * nf.b + i * nf.c;
          var ndist = this._getNoiseDistance(noise, nfactors, dist, n / layers, magnify);
          var normal = this._getSegmentNormal(last, vec, ndist);
          segs.add(n, normal.p1, normal.p2);
        }

        last = vec.clone();
      }

      // draw layered polygons from segment list
      for (var n = 1; n < layers; n++) {
        var s = segs.join(n);
        var curve = new Curve().to(s);
        this.polygon(curveSegments > 0 ? curve.catmullRom(curveSegments) : curve.points);
      }
    }

    /**
     * Draw waving dashed lines with simplex noise
     * @param pts points list
     * @param noise noise instance (seeded)
     * @param nf noise factors { a: current noise value, b: noise scale for layer index, c: noise scale for point index }
     * @param flipSpeed flip thickness (0 or a value that specifies max distance, such as 10)
     * @param distRatio distance ratio (0.5)
     * @param smoothSteps number of steps per average
     * @param maxDist maximum distance
     * @param layers number of layers
     * @param magnify magnification ratio
     * @param curveSegments number of segments for curve, or 0 for no curve
     * @param flatness a number between 0 to 1, to randomize the flatness of the tip
     */
  }, {
    key: "noiseDashLine",
    value: function noiseDashLine(pts, noise) {
      var nf = arguments.length <= 2 || arguments[2] === undefined ? { a: 0, b: 0.005, c: 0.005 } : arguments[2];
      var flipSpeed = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
      var distRatio = arguments.length <= 4 || arguments[4] === undefined ? 0.5 : arguments[4];
      var smoothSteps = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
      var maxDist = arguments.length <= 6 || arguments[6] === undefined ? 0 : arguments[6];
      var layers = arguments.length <= 7 || arguments[7] === undefined ? 15 : arguments[7];
      var magnify = arguments.length <= 8 || arguments[8] === undefined ? 3 : arguments[8];
      var curveSegments = arguments.length <= 9 || arguments[9] === undefined ? 0 : arguments[9];
      var flatness = arguments.length <= 10 || arguments[10] === undefined ? 1 : arguments[10];

      var last = null;
      var lastLayer = [];
      var olderLayer = [];
      var distSteps = [];

      // go through each points
      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        if (!last && Math.random() < flatness) {
          last = vec.clone();
          continue;
        }

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = flipSpeed > 0 ? flipSpeed - Math.min(flipSpeed, dist) : dist;
        dist = this._smooth(distSteps, dist, smoothSteps);

        // noise segments for each layer
        for (var n = 1; n < layers; n++) {

          var nfactors = nf.a + n * nf.b + i * nf.c;
          var ndist = this._getNoiseDistance(noise, nfactors, dist, n / layers, magnify);
          var normal = this._getSegmentNormal(last, vec, ndist, 0.5, distRatio);

          if (lastLayer[n] && (i + n) % 2 === 0) {
            var older = olderLayer[n] && Math.abs(i - n) % 3 == 0 ? olderLayer : lastLayer;
            var ln1 = new Line(older[n].p1).to(normal.p1);
            var ln2 = new Line(older[n].p2).to(normal.p2);

            // a bit shorter to avoid "banding" when drawing closely
            if (Math.max(ln1.size().x, ln1.size().y) < 20) ln1.to(ln1.interpolate(0.94));
            if (Math.max(ln2.size().x, ln2.size().y) < 20) ln2.to(ln2.interpolate(0.94));

            this.line(ln1);
            this.line(ln2);

            olderLayer[n] = { p1: lastLayer[n].p1, p2: lastLayer[n].p2 };
          }

          lastLayer[n] = { p1: normal.p1, p2: normal.p2 };
        }

        last = vec.clone();
      }
    }

    /**
     * Draw choppy lines with simplex noise
     * @param pts points list
     * @param noise noise instance (seeded)
     * @param nf noise factors { a: current noise value, b: noise scale for layer index, c: noise scale for point index }
     * @param flipSpeed flip thickness (0 or a value that specifies max distance, such as 10)
     * @param distRatio distance ratio (0.5)
     * @param smoothSteps number of steps per average
     * @param maxDist maximum distance
     * @param layers number of layers
     * @param magnify magnification ratio
     * @param curveSegments number of segments for curve, or 0 for no curve
     */
  }, {
    key: "noiseChopLine",
    value: function noiseChopLine(pts, noise) {
      var nf = arguments.length <= 2 || arguments[2] === undefined ? { a: 0, b: 0.005, c: 0.005 } : arguments[2];
      var flipSpeed = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
      var distRatio = arguments.length <= 4 || arguments[4] === undefined ? 0.5 : arguments[4];
      var smoothSteps = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
      var maxDist = arguments.length <= 6 || arguments[6] === undefined ? 0 : arguments[6];
      var layers = arguments.length <= 7 || arguments[7] === undefined ? 15 : arguments[7];
      var magnify = arguments.length <= 8 || arguments[8] === undefined ? 3 : arguments[8];
      var curveSegments = arguments.length <= 9 || arguments[9] === undefined ? 0 : arguments[9];

      var last = null;
      var lastPt = [];
      var distSteps = [];

      // go through each points
      for (var i = 0; i < pts.length; i++) {
        var vec = new Vector(pts[i]);

        // smooth distance
        var dist = this._getSegmentDistance(last, vec, i) * distRatio;
        if (maxDist > 0) dist = Math.min(dist, maxDist);
        dist = flipSpeed > 0 ? flipSpeed - Math.min(flipSpeed, dist) : dist;
        dist = this._smooth(distSteps, dist, smoothSteps);

        // noise segments for each layer
        for (var n = 1; n < layers; n++) {

          var nfactors = nf.a + n * nf.b + i * nf.c;
          var ndist = this._getNoiseDistance(noise, nfactors, dist, n / layers, magnify);
          var normal = this._getSegmentNormal(last, vec, ndist, 0.2, distRatio);
          var normal2 = this._getSegmentNormal(last, vec, ndist, 0.8, distRatio);

          if (lastPt[n]) {
            var chop = Math.floor(10 * ndist / dist);
            if (chop > 2) {
              this.line(new Line(lastPt[n].np1).to(normal2.p1));
              this.line(new Line(lastPt[n].p1).to(normal.p1));
            }
          }

          lastPt[n] = { p1: normal.p1.clone(), p2: normal.p2.clone(), np1: normal2.p1.clone(), np2: normal2.p2.clone() };
        }

        last = vec.clone();
      }
    }
  }]);

  return LineForm;
})(Form);

var BaseLine = (function (_Curve) {
  _inherits(BaseLine, _Curve);

  function BaseLine() {
    _classCallCheck(this, BaseLine);

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    _get(Object.getPrototypeOf(BaseLine.prototype), "constructor", this).apply(this, args);

    this.canvasSize = new Vector();
    this.pressed = false; // mouse pressed
    this.form = null;

    this.maxPoints = 200;
    this.maxTracePoints = 30;

    this.pointThreshold = 10;
    this.distanceThreshold = 200 * 200;
    this.moveCount = 0;
    this.maxMoveCount = 10;

    this.noInput = false; // set to true to disable mouse and touch input

    this.colors = {
      "black": function black() {
        var a = arguments.length <= 0 || arguments[0] === undefined ? 0.8 : arguments[0];
        return {
          dark: "rgba(51,64,87, " + a + ")",
          dark2: "rgba(51,64,87, .1)",
          light: "#fff",
          light2: "rgba(255,255,255, .1)"
        };
      },
      "grey": function grey() {
        var a = arguments.length <= 0 || arguments[0] === undefined ? 0.6 : arguments[0];
        return {
          dark: "rgba(101,115,154, " + a + ")",
          dark2: "rgba(101,115,154,.1)",
          light: "#fff",
          light2: "rgba(255,255,255, .1)"
        };
      },
      "tint": function tint() {
        var a = arguments.length <= 0 || arguments[0] === undefined ? 0.5 : arguments[0];
        return {
          dark: "rgba(230,235,242, " + a + ")",
          dark2: "rgba(230,235,242, .1)",
          light: "#fff",
          light2: "rgba(255,255,255, .1)"
        };
      },
      "white": function white() {
        var a = arguments.length <= 0 || arguments[0] === undefined ? 0.8 : arguments[0];
        return {
          dark: "rgba(255,255,255, " + a + ")",
          dark2: "rgba(255,255,255, .2)",
          light: "#fff",
          light2: "rgba(255,255,255, .1)"
        };
      } };

    this.color = {
      dark: "#ff2d5d",
      dark2: "rgba(255,45,93, .1)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };

    this.tracing = false;
    this.counter = 0;
  }

  /**
   * Initiate it with a form
   * @param form Form instance
   * @param maxPoints optionally, set a maximum number of point on this line
   */

  _createClass(BaseLine, [{
    key: "init",
    value: function init(space) {
      var maxPoints = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      this.canvasSize.set(space.size);
      this.form = new LineForm(space);
      if (maxPoints) this.maxPoints = maxPoints;
      return this;
    }
  }, {
    key: "getColor",
    value: function getColor() {
      var c = arguments.length <= 0 || arguments[0] === undefined ? "color" : arguments[0];

      if (!this.tracing) {
        return this[c].dark;
      } else {
        return this.counter % 2 === 0 ? this[c].dark2 : this[c].light2;
      }
    }

    /**
     * Set line color
     * @param c { dark, dark2, light, light2 }
     * @param c2 { dark, dark2, light, light2 }
     */
  }, {
    key: "setColor",
    value: function setColor(c) {
      var c2 = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      this.color = c;
      if (c2) this.color2 = c2;
    }

    /**
     * Space's animate callback. Override in subclass for additional features and drawing styles.
     */
  }, {
    key: "animate",
    value: function animate(time, fs, context) {
      this.counter++;
      this.draw();
    }
  }, {
    key: "trace",
    value: function trace(b) {
      this.tracing = b;
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      f.stroke(this.getColor()).fill(false);
      f.curve(this.catmullRom(5), false);
    }

    /**
     * Stop drawing shortly after mouse has stopped moving
     * @param threshold
     * @returns {boolean}
     */
  }, {
    key: "shouldDraw",
    value: function shouldDraw() {
      var threshold = arguments.length <= 0 || arguments[0] === undefined ? -2 : arguments[0];

      if (!this.tracing) return true;
      if (this.moveCount > threshold) this.moveCount--;
      return this.moveCount > threshold;
    }

    /**
     * Trim points array if max point is reached. Override in subclass for additional features.
     */
  }, {
    key: "trim",
    value: function trim() {
      var m = this.tracing ? this.maxTracePoints : this.maxPoints;
      if (this.points.length > m) {
        this.disconnect(Math.floor(this.points.length / 100));
      }
    }
  }, {
    key: "glue",
    value: function glue(mag) {
      if (mag > this.distanceThreshold && this.points.length > 1) {

        if (mag > this.distanceThreshold * 3) {
          this.points = [this.points.pop()];
          return;
        }

        var p2 = this.points.pop();
        var p1 = this.points.pop();

        var lns = new Line(p1).to(p2).subpoints(Math.floor(this.distanceThreshold / 5000));

        this.to(lns);
      }
    }

    /**
     * When moving. Override in subclass for additional features.
     */
  }, {
    key: "move",
    value: function move(x, y, z) {

      var last = new Vector(this.points[this.points.length - 1]).$subtract(x, y).magnitude(false);
      if (last > this.pointThreshold) {

        this.to(x, y);
        this.trim();
        this.glue(last);

        if (this.pressed) this.drag(x, y);
      }

      if (this.moveCount < this.maxMoveCount) this.moveCount += 2;
    }

    /**
     * When dragging. Override in subclass for additional features.
     */
  }, {
    key: "drag",
    value: function drag(x, y) {
      this.tracing = true;
    }

    /**
     * When pencil is down. Override in subclass for additional features.
     */
  }, {
    key: "down",
    value: function down(x, y) {
      this.points = [];
      this.tracing = !this.tracing;
    }

    /**
     * When pencil is up. Override in subclass for additional features.
     */
  }, {
    key: "up",
    value: function up(x, y) {}
  }, {
    key: "_penAction",
    value: function _penAction(type, x, y) {

      if (this.noInput === true) return;

      // when mouse move, add a point to the trail
      if (type == "move") {
        this.move(x, y);
      }

      // check whether mouse is down
      if (type == "down") {
        this.pressed = true;
        this.down(x, y);
      } else if (type == "up") {
        this.pressed = false;
        this.up(x, y);
      } else if (type == "out") {
        this.pressed = false;
      }
    }

    /**
     * Space's bindMouse callback
     */
  }, {
    key: "onMouseAction",
    value: function onMouseAction(type, x, y, evt) {
      this._penAction(type, x, y);
    }
  }, {
    key: "onTouchAction",
    value: function onTouchAction(type, px, py, evt) {
      var touchPoints = this.form.space.touchesToPoints(evt);
      if (touchPoints && touchPoints.length > 0) this._penAction(type, touchPoints[0].x, touchPoints[0].y);
    }
  }]);

  return BaseLine;
})(Curve);

var DottedLine = (function (_BaseLine) {
  _inherits(DottedLine, _BaseLine);

  function DottedLine() {
    _classCallCheck(this, DottedLine);

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    _get(Object.getPrototypeOf(DottedLine.prototype), "constructor", this).apply(this, args);

    this.pointThreshold = 50;

    this.color = this.colors.black();
  }

  _createClass(DottedLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.fill(this.getColor()).stroke(false);
      f.dottedLine(this.points, 3, 3, 0.5);
    }
  }]);

  return DottedLine;
})(BaseLine);

var InterpolatedLine = (function (_BaseLine2) {
  _inherits(InterpolatedLine, _BaseLine2);

  function InterpolatedLine() {
    _classCallCheck(this, InterpolatedLine);

    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    _get(Object.getPrototypeOf(InterpolatedLine.prototype), "constructor", this).apply(this, args);

    this.pointThreshold = 50;
    this.maxPoints = 200;

    this.steps = 5;
    this._counter = 0;
    this.direction = 1;

    this.color = this.colors.grey();
    this.color2 = this.colors.black();
  }

  _createClass(InterpolatedLine, [{
    key: "down",
    value: function down(x, y) {
      this.points = [new Vector(x, y), new Vector(x, y), new Vector(x, y), new Vector(x, y)];
      this._counter = 0;
      this.tracing = !this.tracing;
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      if (this.points.length < 4 || !this.points[0]) return;

      // increment counter, and flip direction when reached the end
      this._counter += this.direction;
      if (this._counter >= this.points.length * this.steps - 4 || this._counter <= 0) this.direction *= -1;

      // find current index based on counter
      var currentIndex = Math.max(0, Math.min(this.points.length - 1, Math.floor(this._counter / this.steps)));

      // control points based on index
      var curve = new Curve().to(this.points);
      var ctrls = curve.controlPoints(currentIndex);

      // calculate t
      var t = this._counter % this.steps / this.steps;
      var ts = [t, t * t, t * t * t];

      // current interpolated position on the curve
      var pos = ctrls ? curve.catmullRomPoint(ts, ctrls) : new Vector();

      // draw
      f.stroke(this.getColor()).fill(false);
      f.curve(curve.catmullRom(5), false);

      f.stroke(false).fill(this.getColor("color2"));
      f.point(pos, 2, true);
    }
  }]);

  return InterpolatedLine;
})(BaseLine);

var HatchingLine = (function (_BaseLine3) {
  _inherits(HatchingLine, _BaseLine3);

  function HatchingLine() {
    _classCallCheck(this, HatchingLine);

    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    _get(Object.getPrototypeOf(HatchingLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 150;

    this.pointThreshold = 20;

    this.color = this.colors.black(0.7);
    this.color.dark2 = this.colors.black(0.15).dark;
  }

  _createClass(HatchingLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(this.getColor()).fill(false);
      f.hatchingLine(this.points);
    }
  }]);

  return HatchingLine;
})(BaseLine);

var SpeedLine = (function (_BaseLine4) {
  _inherits(SpeedLine, _BaseLine4);

  function SpeedLine() {
    _classCallCheck(this, SpeedLine);

    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    _get(Object.getPrototypeOf(SpeedLine.prototype), "constructor", this).apply(this, args);

    this.color = {
      dark: "#374a58",
      dark2: "rgba(55,74,88, .1)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };

    this.color2 = {
      dark: "#95b1f9",
      dark2: "rgba(235,46,67, .1)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };
  }

  _createClass(SpeedLine, [{
    key: "distances",
    value: function distances() {
      var last = null;
      this.points.map(function (p) {
        if (!last) return 0;
        var dist = p.distance(last);
        last = p.clone();
        return dist;
      });
    }
  }, {
    key: "maxDistance",
    value: function maxDistance() {
      var ratio = arguments.length <= 0 || arguments[0] === undefined ? 20 : arguments[0];

      return Math.min(this.canvasSize.x, this.canvasSize.y) / ratio;
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      f.stroke(this.getColor()).fill(false);
      f.polygon(this.points, false);

      f.stroke(this.getColor("color2"));
      f.speedLine(this.points, 0.5, this.maxDistance());
    }
  }]);

  return SpeedLine;
})(BaseLine);

var ZigZagLine = (function (_SpeedLine) {
  _inherits(ZigZagLine, _SpeedLine);

  function ZigZagLine() {
    _classCallCheck(this, ZigZagLine);

    for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      args[_key7] = arguments[_key7];
    }

    _get(Object.getPrototypeOf(ZigZagLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 300;

    this.pointThreshold = 30;

    this.color = this.colors.black();
    this.color.dark2 = this.colors.black(.4).dark;
    this.color2 = this.colors.grey(.3);
    //this.color2.dark2 = "rgba(0,0,0,0)";
  }

  _createClass(ZigZagLine, [{
    key: "distances",
    value: function distances() {
      var last = null;
      this.points.map(function (p) {
        if (!last) return 0;
        var dist = p.distance(last);
        last = p.clone();
        return dist;
      });
    }
  }, {
    key: "maxDistance",
    value: function maxDistance() {
      var ratio = arguments.length <= 0 || arguments[0] === undefined ? 20 : arguments[0];

      return Math.min(this.canvasSize.x, this.canvasSize.y) / ratio;
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      this.maxTracePoints = 2 + Math.floor(Math.random() * 3);

      f.stroke(false).fill(this.getColor("color2")).points(this.points, 1);
      f.stroke(this.getColor("color2"), 1).fill(false).polygon(this.points, false);

      var swidth = this.tracing ? 1 : 2;
      f.stroke(this.getColor(), swidth).fill(false);
      f.zigZagLine(this.points, 0.5, this.maxDistance());
    }
  }]);

  return ZigZagLine;
})(SpeedLine);

var RestatedLine = (function (_SpeedLine2) {
  _inherits(RestatedLine, _SpeedLine2);

  function RestatedLine() {
    _classCallCheck(this, RestatedLine);

    for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
      args[_key8] = arguments[_key8];
    }

    _get(Object.getPrototypeOf(RestatedLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 150;
    this.pointThreshold = 7 * 7;

    this.color = this.colors.black(0.6);
    this.color2 = this.colors.black(0.35);
  }

  _createClass(RestatedLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(this.getColor()).fill(false);
      f.curve(this.catmullRom(5), false);

      f.stroke(this.getColor("color2")).fill(false);
      f.restatedLine(this.points, 10, 0.2, 0.2);
    }
  }]);

  return RestatedLine;
})(SpeedLine);

var SpeedBrush = (function (_SpeedLine3) {
  _inherits(SpeedBrush, _SpeedLine3);

  function SpeedBrush() {
    _classCallCheck(this, SpeedBrush);

    for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
      args[_key9] = arguments[_key9];
    }

    _get(Object.getPrototypeOf(SpeedBrush.prototype), "constructor", this).apply(this, args);

    this._flip = 0;
    this.flipSpeed = 0;
    this.maxPoints = 100;

    this.color = this.colors.tint();
    this.color.dark2 = "rgba(255,255,255,.3)";

    this.color2 = this.colors.black();
  }

  _createClass(SpeedBrush, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      f.stroke(false).fill(this.getColor());
      f.speedPolygon(this.points, 0, 0.5, 3, this.maxDistance(30));

      f.stroke(this.getColor("color2")).fill(false);
      f.speedLine(this.points);

      f.stroke(this.getColor("color2")).fill(false);
      f.polygon(this.points, false);
    }
  }, {
    key: "up",
    value: function up(x, y) {
      if (++this._flip % 2 === 0) {
        this.flipSpeed = this.flipSpeed > 0 ? 0 : 15;
      }
    }
  }]);

  return SpeedBrush;
})(SpeedLine);

var SmoothSpeedBrush = (function (_SpeedLine4) {
  _inherits(SmoothSpeedBrush, _SpeedLine4);

  function SmoothSpeedBrush() {
    _classCallCheck(this, SmoothSpeedBrush);

    for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
      args[_key10] = arguments[_key10];
    }

    _get(Object.getPrototypeOf(SmoothSpeedBrush.prototype), "constructor", this).apply(this, args);

    this._flip = 0;
    this.flipSpeed = 0;
    this.maxPoints = 100;

    this.color = {
      dark: "#374a58",
      dark2: "rgba(55,74,88, .1)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };

    this.color2 = {
      dark: "rgba(0,0,0,.5)",
      dark2: "rgba(0,0,0, .1)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };
  }

  _createClass(SmoothSpeedBrush, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      // connect polygons
      f.stroke(false).fill(this.getColor());
      f.speedPolygon(this.points, 0, 0.5, 7, this.maxDistance());

      // draw regular path
      f.stroke(this.getColor("color2")).fill(false);
      f.polygon(this.points, false);
    }
  }, {
    key: "up",
    value: function up(x, y) {
      //if (++this._flip % 2 === 0) {
      //  this.flipSpeed = (this.flipSpeed > 0) ? 0 : 15;
      //}
    }
  }]);

  return SmoothSpeedBrush;
})(SpeedLine);

var InnerLine = (function (_SmoothSpeedBrush) {
  _inherits(InnerLine, _SmoothSpeedBrush);

  function InnerLine() {
    _classCallCheck(this, InnerLine);

    for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
      args[_key11] = arguments[_key11];
    }

    _get(Object.getPrototypeOf(InnerLine.prototype), "constructor", this).apply(this, args);

    this.flipSpeed = 0;
    this.maxPoints = 100;

    this.color = this.colors.black();
    this.color.dark2 = this.colors.grey(0.02).dark;
    this.color.light2 = this.colors.tint(0.02).dark;
  }

  _createClass(InnerLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(this.getColor()).fill(false);
      f.innerLine(this.points, 20, 1, 7);
    }
  }, {
    key: "up",
    value: function up() {}
  }]);

  return InnerLine;
})(SmoothSpeedBrush);

var WiggleLine = (function (_InnerLine) {
  _inherits(WiggleLine, _InnerLine);

  function WiggleLine() {
    _classCallCheck(this, WiggleLine);

    for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
      args[_key12] = arguments[_key12];
    }

    _get(Object.getPrototypeOf(WiggleLine.prototype), "constructor", this).apply(this, args);

    this.flipSpeed = 0;
    this.maxPoints = 100;
    this.angle = 0;

    this.color = this.colors.black();
  }

  _createClass(WiggleLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      this.angle += Const.one_degree;
      var density = this.tracing ? 6 : 30;

      // connect polygons
      f.stroke(this.getColor()).fill(false);
      f.innerWiggleLine(this.points, density, 70, { angle: this.angle, step: Const.one_degree * 5 }, 1.5, 2);
    }
  }]);

  return WiggleLine;
})(InnerLine);

var NoiseLine = (function (_SpeedBrush) {
  _inherits(NoiseLine, _SpeedBrush);

  function NoiseLine() {
    _classCallCheck(this, NoiseLine);

    for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
      args[_key13] = arguments[_key13];
    }

    _get(Object.getPrototypeOf(NoiseLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 60;
    this.maxTracePoints = 20;

    this.noise = new Noise();

    // noise seed defines the styles
    this.seeds = [0.7642476900946349, 0.04564903723075986, 0.4202376299072057, 0.35483957454562187, 0.9071740123908967, 0.8731264418456703, 0.7436990102287382, 0.23965814616531134];

    this.seedIndex = 2;
    this.noise.seed(this.seeds[this.seedIndex]);

    this.pointThreshold = 20;
    this.flipSpeed = 0;

    // override color
    this.color = {
      dark: "rgba(0,0,0,.3)",
      dark2: "rgba(0,0,0,.05)",
      light: "#f3f5f9",
      light2: "rgba(243,245,249, 0)"
    };
  }

  _createClass(NoiseLine, [{
    key: "seed",
    value: function seed() {
      this.noise = new Noise();
      this.seedIndex = this.seedIndex >= this.seeds.length - 1 ? 0 : this.seedIndex + 1;
      this.noise.seed(this.seedIndex);
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      f.stroke(this.getColor()).fill(false);

      var distRatio = 1;
      var smooth = 3;
      var layers = 3;
      var magnify = 1;
      var curveSegments = 3;

      var noiseFactors = { a: 0, b: 0.01, c: 0.01 };
      f.noisePolygon(this.points, this.noise, noiseFactors, this.flipSpeed, distRatio, smooth, this.maxDistance(), layers, magnify, curveSegments);
    }
  }, {
    key: "up",
    value: function up() {
      if (++this._flip % 2 === 0) {
        this.flipSpeed = this.flipSpeed > 0 ? 0 : 25;
      }
      this.seed();
    }
  }]);

  return NoiseLine;
})(SpeedBrush);

var NoiseBrush = (function (_SpeedBrush2) {
  _inherits(NoiseBrush, _SpeedBrush2);

  function NoiseBrush() {
    _classCallCheck(this, NoiseBrush);

    for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
      args[_key14] = arguments[_key14];
    }

    _get(Object.getPrototypeOf(NoiseBrush.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 50;
    this.maxTracePoints = 20;

    this.noise = new Noise();

    // noise seed defines the styles
    this.seeds = [0.7642476900946349, 0.04564903723075986, 0.4202376299072057, 0.35483957454562187, 0.9071740123908967, 0.8731264418456703, 0.7436990102287382, 0.23965814616531134];

    this.seedIndex = 2;
    this.noise.seed(this.seeds[this.seedIndex]);

    this.pointThreshold = 20;
    this.flipSpeed = 0;

    // override color
    this.color = {
      dark: "rgba(21,34,47,.65)",
      dark2: "rgba(21,34,47,.05)",
      light: "#f3f5f9",
      light2: "rgba(21,34,47, 0.05)"
    };
  }

  _createClass(NoiseBrush, [{
    key: "seed",
    value: function seed() {
      this.noise = new Noise();
      this.seedIndex = this.seedIndex >= this.seeds.length - 1 ? 0 : this.seedIndex + 1;
      this.noise.seed(this.seedIndex);
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(false).fill(this.getColor());

      var distRatio = 0.5;
      var smooth = 5;
      var layers = 5;
      var magnify = 2;
      var curveSegments = 3;

      var noiseFactors = { a: 0, b: 0.05, c: 0.007 };
      f.noisePolygon(this.points, this.noise, noiseFactors, this.flipSpeed, distRatio, smooth, this.maxDistance(), layers, magnify, curveSegments);
    }
  }, {
    key: "up",
    value: function up() {
      _get(Object.getPrototypeOf(NoiseBrush.prototype), "up", this).call(this);
      this.seed();
    }
  }]);

  return NoiseBrush;
})(SpeedBrush);

var SmoothNoiseLine = (function (_SpeedBrush3) {
  _inherits(SmoothNoiseLine, _SpeedBrush3);

  function SmoothNoiseLine() {
    _classCallCheck(this, SmoothNoiseLine);

    for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
      args[_key15] = arguments[_key15];
    }

    _get(Object.getPrototypeOf(SmoothNoiseLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 50;

    this.noise = new Noise();
    this.noiseProgress = 0.01;

    // noise seed defines the styles
    this.seeds = [0.7642476900946349, 0.04564903723075986, 0.4202376299072057, 0.35483957454562187, 0.9071740123908967, 0.8731264418456703, 0.7436990102287382, 0.23965814616531134];

    this.seedIndex = 2;
    this.noise.seed(this.seeds[this.seedIndex]);

    this.noiseFactorIndex = 0.01;
    this.noiseFactorLayer = 0.03;
    this.alpha = 0.25;

    this.pointThreshold = 20;
    this.flipSpeed = 0;

    this.color = this.colors.grey(0.3);
    this.color.dark2 = "rgba(0,0,20, .03)";
    this.color.light2 = "rgba(245,245,255, .02)";
    this.color2 = this.colors.black(0.1);
    this.color2.dark2 = "rgba(0,0,20, .01)";
    this.color2.light2 = "rgba(51,64,87, 0)";
  }

  _createClass(SmoothNoiseLine, [{
    key: "seed",
    value: function seed() {
      this.noise = new Noise();
      this.seedIndex = this.seedIndex >= this.seeds.length - 1 ? 0 : this.seedIndex + 1;
      this.noise.seed(this.seeds[this.seedIndex]);
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      var strokeWidth = this.tracing ? 3 : 1;
      f.stroke(this.getColor(), strokeWidth).fill(this.getColor("color2"));

      var distRatio = 1;
      var smooth = 5;
      var layers = 8;
      var magnify = 1;
      var curveSegments = 3;

      this.noiseProgress += 0.004;
      var noiseFactors = { a: this.noiseProgress, b: this.noiseFactorIndex, c: this.noiseFactorLayer };
      f.noisePolygon(this.points, this.noise, noiseFactors, this.flipSpeed, distRatio, smooth, this.maxDistance(), layers, magnify, curveSegments);
    }
  }, {
    key: "up",
    value: function up() {
      this.seed();

      this.noiseFactorIndex = Math.max(0.002, Math.random() / 10);
      this.noiseFactorLayer = Math.max(0.002, Math.random() / 10);
      this.alpha += 0.1;
      if (this.alpha > 0.7) this.alpha = 0.05;
    }
  }]);

  return SmoothNoiseLine;
})(SpeedBrush);

var NoiseDashLine = (function (_SpeedBrush4) {
  _inherits(NoiseDashLine, _SpeedBrush4);

  function NoiseDashLine() {
    _classCallCheck(this, NoiseDashLine);

    for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
      args[_key16] = arguments[_key16];
    }

    _get(Object.getPrototypeOf(NoiseDashLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 50;

    this.noise = new Noise();
    this.noiseProgress = 0.01;

    // noise seed defines the styles
    this.seeds = [0.7642476900946349, 0.04564903723075986, 0.4202376299072057, 0.35483957454562187, 0.9071740123908967, 0.8731264418456703, 0.7436990102287382, 0.23965814616531134];

    this.seedIndex = 5;
    this.noise.seed(this.seeds[this.seedIndex]);

    this.noiseFactorIndex = 0.01;
    this.noiseFactorLayer = 0.03;
    this.alpha = 0.25;

    this.pointThreshold = 20;
    this.flipSpeed = 0;

    this.color = this.colors.black(.7);
    this.color.dark2 = this.colors.black(.05).dark;
  }

  _createClass(NoiseDashLine, [{
    key: "seed",
    value: function seed() {
      this.noise = new Noise();
      this.seedIndex = this.seedIndex >= this.seeds.length - 1 ? 0 : this.seedIndex + 1;
      this.noise.seed(this.seeds[this.seedIndex]);
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.fill(false).stroke(this.getColor());

      var distRatio = (this.seedIndex + 1) / 4;
      var smooth = 4;
      var layers = 8;
      var magnify = 1.25;
      var curveSegments = 1;

      this.noiseProgress += 0.003;
      var noiseFactors = { a: this.noiseProgress, b: this.noiseFactorIndex, c: this.noiseFactorLayer };
      f.noiseDashLine(this.points, this.noise, noiseFactors, this.flipSpeed, distRatio, smooth, this.maxDistance(), layers, magnify, curveSegments);
    }
  }, {
    key: "up",
    value: function up() {
      _get(Object.getPrototypeOf(NoiseDashLine.prototype), "up", this).call(this);
      this.seed();

      this.noiseFactorIndex = Math.max(0.002, Math.random() / 10);
      this.noiseFactorLayer = Math.max(0.002, Math.random() / 10);
      this.alpha += 0.1;
      if (this.alpha > 0.7) this.alpha = 0.05;
    }
  }]);

  return NoiseDashLine;
})(SpeedBrush);

var NoiseChopLine = (function (_SpeedBrush5) {
  _inherits(NoiseChopLine, _SpeedBrush5);

  function NoiseChopLine() {
    _classCallCheck(this, NoiseChopLine);

    for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
      args[_key17] = arguments[_key17];
    }

    _get(Object.getPrototypeOf(NoiseChopLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 100;

    this.noise = new Noise();
    this.noiseProgress = 0.01;

    // noise seed defines the styles
    this.seeds = [0.7642476900946349, 0.04564903723075986, 0.4202376299072057, 0.35483957454562187, 0.9071740123908967, 0.8731264418456703, 0.7436990102287382, 0.23965814616531134];

    this.seedIndex = 5;
    this.noise.seed(this.seeds[this.seedIndex]);

    this.noiseFactorIndex = 0.01;
    this.noiseFactorLayer = 0.03;
    this.alpha = 0.25;

    this.pointThreshold = 20;
    this.flipSpeed = 0;

    this.color = this.colors.black();
    this.color2 = this.colors.grey(.3);
  }

  _createClass(NoiseChopLine, [{
    key: "seed",
    value: function seed() {
      this.noise = new Noise();
      this.seedIndex = this.seedIndex >= this.seeds.length - 1 ? 0 : this.seedIndex + 1;
      this.noise.seed(this.seeds[this.seedIndex]);
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.fill(false).stroke(this.getColor("color2"), 1);
      if (!this.tracing) f.polygon(this.points, false);

      f.stroke(this.getColor());

      var distRatio = 1;
      var smooth = 4;
      var layers = 5;
      var magnify = 1;
      var curveSegments = 3;

      this.noiseProgress -= 0.008;
      var noiseFactors = { a: this.noiseProgress, b: this.noiseFactorIndex, c: this.noiseFactorLayer };
      f.noiseChopLine(this.points, this.noise, noiseFactors, this.flipSpeed, distRatio, smooth, this.maxDistance(), layers, magnify, curveSegments);
    }
  }, {
    key: "up",
    value: function up() {
      _get(Object.getPrototypeOf(NoiseChopLine.prototype), "up", this).call(this);
      this.seed();

      this.noiseFactorIndex = Math.max(0.002, Math.random() / 10);
      this.noiseFactorLayer = Math.max(0.002, Math.random() / 10);
      this.alpha += 0.1;
      if (this.alpha > 0.7) this.alpha = 0.05;
    }
  }]);

  return NoiseChopLine;
})(SpeedBrush);

var LagLine = (function (_BaseLine5) {
  _inherits(LagLine, _BaseLine5);

  function LagLine() {
    _classCallCheck(this, LagLine);

    for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
      args[_key18] = arguments[_key18];
    }

    _get(Object.getPrototypeOf(LagLine.prototype), "constructor", this).apply(this, args);

    this.pointThreshold = 20;
    this.maxPoints = 100;

    this.targets = [];
    this.ang = 0;

    this.color = {
      dark: "rgba(51,64,87, .5)",
      dark2: "rgba(51,64,87, .2)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };

    this.color2 = {
      dark: "rgba(51,64,87, .2)",
      dark2: "rgba(255,255,255, .3)",
      light: "#fff",
      light2: "rgba(255,255,255, .1)"
    };

    this.lastPoints = [];
    this.angle = 0;
  }

  _createClass(LagLine, [{
    key: "trim",
    value: function trim() {
      _get(Object.getPrototypeOf(LagLine.prototype), "trim", this).call(this);
    }
  }, {
    key: "move",
    value: function move(x, y, z) {
      _get(Object.getPrototypeOf(LagLine.prototype), "move", this).call(this, x, y, z);
      this.targets = [];
      for (var i = 2; i < this.points.length - 2; i++) {
        this.targets[i - 2] = this.points[i - 2];
        //this.targets[i-2] = this.points[i-2].clone();
      }
    }
  }, {
    key: "maxDistance",
    value: function maxDistance() {
      var ratio = arguments.length <= 0 || arguments[0] === undefined ? 20 : arguments[0];

      return Math.min(this.canvasSize.x, this.canvasSize.y) / ratio;
    }
  }, {
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      this.ang += Const.one_degree;

      if (this.targets.length > 3 && this.points.length > 10) {
        for (var t = 0; t < this.targets.length; t++) {
          var d2 = this.points[t].$subtract(this.points[t + 1]);
          this.targets[t].subtract(d2.multiply(0.11));
        }

        this.angle += Const.one_degree;
        f.stroke(this.getColor("color2")).fill(false);
        f.innerWiggleLine(this.points, 4, 50, { angle: this.angle, step: Const.one_degree * 5 }, 1.5, 2);

        f.stroke(this.getColor()).fill(false);

        f.hatchingLine(this.targets);

        f.jaggedLine(this.points, this.lastPoints);
      }
    }
  }]);

  return LagLine;
})(BaseLine);

var GrowLine = (function (_BaseLine6) {
  _inherits(GrowLine, _BaseLine6);

  function GrowLine() {
    _classCallCheck(this, GrowLine);

    for (var _len19 = arguments.length, args = Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {
      args[_key19] = arguments[_key19];
    }

    _get(Object.getPrototypeOf(GrowLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 100;
    this.color = this.colors.black();
    this.color.dark2 = "rgba(0,10,15,.1)";
    this.lastPoints = [];
  }

  _createClass(GrowLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(this.getColor()).fill(false);
      f.growLine(this.points, this.lastPoints);
    }
  }]);

  return GrowLine;
})(BaseLine);

var JaggedLine = (function (_BaseLine7) {
  _inherits(JaggedLine, _BaseLine7);

  function JaggedLine() {
    _classCallCheck(this, JaggedLine);

    for (var _len20 = arguments.length, args = Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {
      args[_key20] = arguments[_key20];
    }

    _get(Object.getPrototypeOf(JaggedLine.prototype), "constructor", this).apply(this, args);

    this.maxPoints = 100;

    this.color = this.colors.black(.3);
    this.color.dark2 = "rgba(0,0,0,0)";

    this.color2 = this.colors.black(1);

    this.lastPoints = [];
  }

  _createClass(JaggedLine, [{
    key: "draw",
    value: function draw() {
      var f = arguments.length <= 0 || arguments[0] === undefined ? this.form : arguments[0];

      if (!this.shouldDraw()) return;

      f.stroke(this.getColor()).fill(false);
      f.polygon(this.points, false);

      f.stroke(this.getColor("color2"));
      f.jaggedLine(this.points, this.lastPoints);
    }
  }]);

  return JaggedLine;
})(BaseLine);