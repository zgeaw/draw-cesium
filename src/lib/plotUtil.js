//图层名称

window.P = { version: '1.0.0' }
;(P.PlotUtils = {}),
  (P.PlotUtils.distance = function(t, o) {
    return Math.sqrt(Math.pow(t[0] - o[0], 2) + Math.pow(t[1] - o[1], 2))
  }),
  (P.PlotUtils.wholeDistance = function(t) {
    for (var o = 0, e = 0; e < t.length - 1; e++) o += P.PlotUtils.distance(t[e], t[e + 1])
    return o
  }),
  (P.PlotUtils.getBaseLength = function(t) {
    return Math.pow(P.PlotUtils.wholeDistance(t), 0.99)
  }),
  (P.PlotUtils.mid = function(t, o) {
    return [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2]
  }),
  (P.PlotUtils.getCircleCenterOfThreePoints = function(t, o, e) {
    var r = [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2],
      n = [r[0] - t[1] + o[1], r[1] + t[0] - o[0]],
      g = [(t[0] + e[0]) / 2, (t[1] + e[1]) / 2],
      i = [g[0] - t[1] + e[1], g[1] + t[0] - e[0]]
    return P.PlotUtils.getIntersectPoint(r, n, g, i)
  }),
  (P.PlotUtils.getIntersectPoint = function(t, o, e, r) {
    if (t[1] == o[1]) {
      var n = (r[0] - e[0]) / (r[1] - e[1]),
        g = n * (t[1] - e[1]) + e[0],
        i = t[1]
      return [g, i]
    }
    if (e[1] == r[1]) {
      var s = (o[0] - t[0]) / (o[1] - t[1])
      return (g = s * (e[1] - t[1]) + t[0]), (i = e[1]), [g, i]
    }
    return (
      (s = (o[0] - t[0]) / (o[1] - t[1])),
      (n = (r[0] - e[0]) / (r[1] - e[1])),
      (i = (s * t[1] - t[0] - n * e[1] + e[0]) / (s - n)),
      (g = s * i - s * t[1] + t[0]),
      [g, i]
    )
  }),
  (P.PlotUtils.getAzimuth = function(t, o) {
    var e,
      r = Math.asin(Math.abs(o[1] - t[1]) / P.PlotUtils.distance(t, o))
    return (
      o[1] >= t[1] && o[0] >= t[0]
        ? (e = r + Math.PI)
        : o[1] >= t[1] && o[0] < t[0]
        ? (e = P.Constants.TWO_PI - r)
        : o[1] < t[1] && o[0] < t[0]
        ? (e = r)
        : o[1] < t[1] && o[0] >= t[0] && (e = Math.PI - r),
      e
    )
  }),
  (P.PlotUtils.getAngleOfThreePoints = function(t, o, e) {
    var r = P.PlotUtils.getAzimuth(o, t) - P.PlotUtils.getAzimuth(o, e)
    return 0 > r ? r + P.Constants.TWO_PI : r
  }),
  (P.PlotUtils.isClockWise = function(t, o, e) {
    return (e[1] - t[1]) * (o[0] - t[0]) > (o[1] - t[1]) * (e[0] - t[0])
  }),
  (P.PlotUtils.getPointOnLine = function(t, o, e) {
    var r = o[0] + t * (e[0] - o[0]),
      n = o[1] + t * (e[1] - o[1])
    return [r, n]
  }),
  (P.PlotUtils.getCubicValue = function(t, o, e, r, n) {
    t = Math.max(Math.min(t, 1), 0)
    var g = 1 - t,
      i = t * t,
      s = i * t,
      a = g * g,
      l = a * g,
      u = l * o[0] + 3 * a * t * e[0] + 3 * g * i * r[0] + s * n[0],
      c = l * o[1] + 3 * a * t * e[1] + 3 * g * i * r[1] + s * n[1]
    return [u, c]
  }),
  (P.PlotUtils.getThirdPoint = function(t, o, e, r, n) {
    var g = P.PlotUtils.getAzimuth(t, o),
      i = n ? g + e : g - e,
      s = r * Math.cos(i),
      a = r * Math.sin(i)
    return [o[0] + s, o[1] + a]
  }),
  (P.PlotUtils.getArcPoints = function(t, o, e, r) {
    var n,
      g,
      i = [],
      s = r - e
    s = 0 > s ? s + P.Constants.TWO_PI : s
    for (var a = 0; a <= P.Constants.FITTING_COUNT; a++) {
      var l = e + (s * a) / P.Constants.FITTING_COUNT
      ;(n = t[0] + o * Math.cos(l)), (g = t[1] + o * Math.sin(l)), i.push([n, g])
    }
    return i
  }),
  (P.PlotUtils.getBisectorNormals = function(t, o, e, r) {
    var n = P.PlotUtils.getNormal(o, e, r),
      g = Math.sqrt(n[0] * n[0] + n[1] * n[1]),
      i = n[0] / g,
      s = n[1] / g,
      a = P.PlotUtils.distance(o, e),
      l = P.PlotUtils.distance(e, r)
    if (g > P.Constants.ZERO_TOLERANCE)
      if (P.PlotUtils.isClockWise(o, e, r)) {
        var u = t * a,
          c = e[0] - u * s,
          p = e[1] + u * i,
          h = [c, p]
        ;(u = t * l), (c = e[0] + u * s), (p = e[1] - u * i)
        var d = [c, p]
      } else
        (u = t * a),
          (c = e[0] + u * s),
          (p = e[1] - u * i),
          (h = [c, p]),
          (u = t * l),
          (c = e[0] - u * s),
          (p = e[1] + u * i),
          (d = [c, p])
    else
      (c = e[0] + t * (o[0] - e[0])),
        (p = e[1] + t * (o[1] - e[1])),
        (h = [c, p]),
        (c = e[0] + t * (r[0] - e[0])),
        (p = e[1] + t * (r[1] - e[1])),
        (d = [c, p])
    return [h, d]
  }),
  (P.PlotUtils.getNormal = function(t, o, e) {
    var r = t[0] - o[0],
      n = t[1] - o[1],
      g = Math.sqrt(r * r + n * n)
    ;(r /= g), (n /= g)
    var i = e[0] - o[0],
      s = e[1] - o[1],
      a = Math.sqrt(i * i + s * s)
    ;(i /= a), (s /= a)
    var l = r + i,
      u = n + s
    return [l, u]
  }),
  (P.PlotUtils.getCurvePoints = function(t, o) {
    for (var e = P.PlotUtils.getLeftMostControlPoint(o), r = [e], n = 0; n < o.length - 2; n++) {
      var g = o[n],
        i = o[n + 1],
        s = o[n + 2],
        a = P.PlotUtils.getBisectorNormals(t, g, i, s)
      r = r.concat(a)
    }
    var l = P.PlotUtils.getRightMostControlPoint(o)
    r.push(l)
    var u = []
    for (n = 0; n < o.length - 1; n++) {
      ;(g = o[n]), (i = o[n + 1]), u.push(g)
      for (var t = 0; t < P.Constants.FITTING_COUNT; t++) {
        var c = P.PlotUtils.getCubicValue(t / P.Constants.FITTING_COUNT, g, r[2 * n], r[2 * n + 1], i)
        u.push(c)
      }
      u.push(i)
    }
    return u
  }),
  (P.PlotUtils.getLeftMostControlPoint = function(o) {
    var e = o[0],
      r = o[1],
      n = o[2],
      g = P.PlotUtils.getBisectorNormals(0, e, r, n),
      i = g[0],
      s = P.PlotUtils.getNormal(e, r, n),
      a = Math.sqrt(s[0] * s[0] + s[1] * s[1])
    if (a > P.Constants.ZERO_TOLERANCE)
      var l = P.PlotUtils.mid(e, r),
        u = e[0] - l[0],
        c = e[1] - l[1],
        p = P.PlotUtils.distance(e, r),
        h = 2 / p,
        d = -h * c,
        f = h * u,
        E = d * d - f * f,
        v = 2 * d * f,
        A = f * f - d * d,
        _ = i[0] - l[0],
        y = i[1] - l[1],
        m = l[0] + E * _ + v * y,
        O = l[1] + v * _ + A * y
    else (m = e[0] + t * (r[0] - e[0])), (O = e[1] + t * (r[1] - e[1]))
    return [m, O]
  }),
  (P.PlotUtils.getRightMostControlPoint = function(o) {
    var e = o.length,
      r = o[e - 3],
      n = o[e - 2],
      g = o[e - 1],
      i = P.PlotUtils.getBisectorNormals(0, r, n, g),
      s = i[1],
      a = P.PlotUtils.getNormal(r, n, g),
      l = Math.sqrt(a[0] * a[0] + a[1] * a[1])
    if (l > P.Constants.ZERO_TOLERANCE)
      var u = P.PlotUtils.mid(n, g),
        c = g[0] - u[0],
        p = g[1] - u[1],
        h = P.PlotUtils.distance(n, g),
        d = 2 / h,
        f = -d * p,
        E = d * c,
        v = f * f - E * E,
        A = 2 * f * E,
        _ = E * E - f * f,
        y = s[0] - u[0],
        m = s[1] - u[1],
        O = u[0] + v * y + A * m,
        T = u[1] + A * y + _ * m
    else (O = g[0] + t * (n[0] - g[0])), (T = g[1] + t * (n[1] - g[1]))
    return [O, T]
  }),
  (P.PlotUtils.getBezierPoints = function(t) {
    if (t.length <= 2) return t
    for (var o = [], e = t.length - 1, r = 0; 1 >= r; r += 0.01) {
      for (var n = (y = 0), g = 0; e >= g; g++) {
        var i = P.PlotUtils.getBinomialFactor(e, g),
          s = Math.pow(r, g),
          a = Math.pow(1 - r, e - g)
        ;(n += i * s * a * t[g][0]), (y += i * s * a * t[g][1])
      }
      o.push([n, y])
    }
    return o.push(t[e]), o
  }),
  (P.PlotUtils.getBinomialFactor = function(t, o) {
    return P.PlotUtils.getFactorial(t) / (P.PlotUtils.getFactorial(o) * P.PlotUtils.getFactorial(t - o))
  }),
  (P.PlotUtils.getFactorial = function(t) {
    if (1 >= t) return 1
    if (2 == t) return 2
    if (3 == t) return 6
    if (4 == t) return 24
    if (5 == t) return 120
    for (var o = 1, e = 1; t >= e; e++) o *= e
    return o
  }),
  (P.PlotUtils.getQBSplinePoints = function(t) {
    if (t.length <= 2) return t
    var o = 2,
      e = [],
      r = t.length - o - 1
    e.push(t[0])
    for (var n = 0; r >= n; n++)
      for (var g = 0; 1 >= g; g += 0.05) {
        for (var i = (y = 0), s = 0; o >= s; s++) {
          var a = P.PlotUtils.getQuadricBSplineFactor(s, g)
          ;(i += a * t[n + s][0]), (y += a * t[n + s][1])
        }
        e.push([i, y])
      }
    return e.push(t[t.length - 1]), e
  }),
  (P.PlotUtils.getQuadricBSplineFactor = function(t, o) {
    return 0 == t
      ? Math.pow(o - 1, 2) / 2
      : 1 == t
      ? (-2 * Math.pow(o, 2) + 2 * o + 1) / 2
      : 2 == t
      ? Math.pow(o, 2) / 2
      : 0
  }),
  (P.Constants = {
    TWO_PI: 2 * Math.PI,
    HALF_PI: Math.PI / 2,
    FITTING_COUNT: 100,
    ZERO_TOLERANCE: 1e-4
  })

window.xp = {
  version: '2.0.0',
  createTime: '2023.2.7',
  author: 'gengweigang'
}
window.doubleArrowDefualParam = {
  type: 'doublearrow',
  headHeightFactor: 0.25,
  headWidthFactor: 0.3,
  neckHeightFactor: 0.85,
  fixPointCount: 4,
  neckWidthFactor: 0.15
}
window.tailedAttackArrowDefualParam = {
  headHeightFactor: 0.18,
  headWidthFactor: 0.3,
  neckHeightFactor: 0.85,
  neckWidthFactor: 0.15,
  tailWidthFactor: 0.1,
  headTailFactor: 0.8,
  swallowTailFactor: 1
}
window.fineArrowDefualParam = {
  tailWidthFactor: 0.15,
  neckWidthFactor: 0.2,
  headWidthFactor: 0.25,
  headAngle: Math.PI / 8.5,
  neckAngle: Math.PI / 13
}
;(xp.algorithm = {}),
  (xp.algorithm.doubleArrow = function(inputPoint) {
    this.connPoint = null
    this.tempPoint4 = null
    this.points = inputPoint
    var result = {
      controlPoint: null,
      polygonalPoint: null
    }
    //获取已经点击的坐标数
    var t = inputPoint.length
    if (!(2 > t)) {
      if (2 == t) return inputPoint
      var o = this.points[0], //第一个点
        e = this.points[1], //第二个点
        r = this.points[2], //第三个点
        t = inputPoint.length //获取已经点击的坐标数
      //下面的是移动点位后的坐标
      3 == t ? (this.tempPoint4 = xp.algorithm.getTempPoint4(o, e, r)) : (this.tempPoint4 = this.points[3]),
        3 == t || 4 == t ? (this.connPoint = P.PlotUtils.mid(o, e)) : (this.connPoint = this.points[4])
      var n, g
      P.PlotUtils.isClockWise(o, e, r)
        ? ((n = xp.algorithm.getArrowPoints(o, this.connPoint, this.tempPoint4, !1)),
          (g = xp.algorithm.getArrowPoints(this.connPoint, e, r, !0)))
        : ((n = xp.algorithm.getArrowPoints(e, this.connPoint, r, !1)),
          (g = xp.algorithm.getArrowPoints(this.connPoint, o, this.tempPoint4, !0)))
      var i = n.length,
        s = (i - 5) / 2,
        a = n.slice(0, s),
        l = n.slice(s, s + 5),
        u = n.slice(s + 5, i),
        c = g.slice(0, s),
        p = g.slice(s, s + 5),
        h = g.slice(s + 5, i)
      c = P.PlotUtils.getBezierPoints(c)
      var d = P.PlotUtils.getBezierPoints(h.concat(a.slice(1)))
      u = P.PlotUtils.getBezierPoints(u)
      var f = c.concat(p, d, l, u)
      var newArray = xp.algorithm.array2Dto1D(f)
      result.controlPoint = [o, e, r, this.tempPoint4, this.connPoint]
      result.polygonalPoint = Cesium.Cartesian3.fromDegreesArray(newArray)
    }
    return result
  }),
  (xp.algorithm.threeArrow = function(inputPoint) {
    this.connPoint = null
    this.tempPoint4 = null
    this.tempPoint5 = null
    this.points = inputPoint
    var result = {
      controlPoint: null,
      polygonalPoint: null
    }
    //获取已经点击的坐标数
    var t = inputPoint.length
    if (t >= 2) {
      if (t == 2) {
        return inputPoint
      }
      var o = this.points[0], //第一个点
        e = this.points[1], //第二个点
        r = this.points[2], //第三个点
        t = inputPoint.length //获取已经点击的坐标数
      //下面的是移动点位后的坐标
      if (t == 3) {
        this.tempPoint4 = xp.algorithm.getTempPoint4(o, e, r)
        this.tempPoint5 = P.PlotUtils.mid(r, this.tempPoint4)
      } else {
        this.tempPoint4 = this.points[3]
        this.tempPoint5 = this.points[4]
      }
      if (t < 6) {
        this.connPoint = P.PlotUtils.mid(o, e)
      } else {
        this.connPoint = this.points[5]
      }
      var n, g
      if (P.PlotUtils.isClockWise(o, e, r)) {
        n = xp.algorithm.getArrowPoints(o, this.connPoint, this.tempPoint4, !1)
        g = xp.algorithm.getArrowPoints(this.connPoint, e, r, !0)
      } else {
        n = xp.algorithm.getArrowPoints(e, this.connPoint, r, !1)
        g = xp.algorithm.getArrowPoints(this.connPoint, o, this.tempPoint4, !0)
      }
      var i = n.length,
        s = (i - 5) / 2,
        a = n.slice(0, s),
        l = n.slice(s, s + 5),
        u = n.slice(s + 5, i),
        c = g.slice(0, s),
        p = g.slice(s, s + 5),
        h = g.slice(s + 5, i)
      c = P.PlotUtils.getBezierPoints(c)
      var d = P.PlotUtils.getBezierPoints(h.concat(a.slice(1)))
      u = P.PlotUtils.getBezierPoints(u)
      var f = c.concat(p, d, l, u)
      var newArray = xp.algorithm.array2Dto1D(f)
      result.controlPoint = [o, e, r, this.tempPoint4, this.tempPoint5, this.connPoint]
      result.polygonalPoint = Cesium.Cartesian3.fromDegreesArray(newArray)
    }
    return result
  }),
  (xp.algorithm.array2Dto1D = function(array) {
    var newArray = []
    array.forEach(function(elt) {
      newArray.push(elt[0])
      newArray.push(elt[1])
    })
    return newArray
  }),
  (xp.algorithm.getArrowPoints = function(t, o, e, r) {
    ;(this.type = doubleArrowDefualParam.type),
      (this.headHeightFactor = doubleArrowDefualParam.headHeightFactor),
      (this.headWidthFactor = doubleArrowDefualParam.headWidthFactor),
      (this.neckHeightFactor = doubleArrowDefualParam.neckHeightFactor),
      (this.neckWidthFactor = doubleArrowDefualParam.neckWidthFactor)
    var n = P.PlotUtils.mid(t, o),
      g = P.PlotUtils.distance(n, e),
      i = P.PlotUtils.getThirdPoint(e, n, 0, 0.3 * g, !0),
      s = P.PlotUtils.getThirdPoint(e, n, 0, 0.5 * g, !0)
    ;(i = P.PlotUtils.getThirdPoint(n, i, P.Constants.HALF_PI, g / 5, r)),
      (s = P.PlotUtils.getThirdPoint(n, s, P.Constants.HALF_PI, g / 4, r))
    var a = [n, i, s, e],
      l = xp.algorithm.getArrowHeadPoints(
        a,
        this.headHeightFactor,
        this.headWidthFactor,
        this.neckHeightFactor,
        this.neckWidthFactor
      ),
      u = l[0],
      c = l[4],
      p = P.PlotUtils.distance(t, o) / P.PlotUtils.getBaseLength(a) / 2,
      h = xp.algorithm.getArrowBodyPoints(a, u, c, p),
      d = h.length,
      f = h.slice(0, d / 2),
      E = h.slice(d / 2, d)
    return f.push(u), E.push(c), (f = f.reverse()), f.push(o), (E = E.reverse()), E.push(t), f.reverse().concat(l, E)
  }),
  (xp.algorithm.getArrowHeadPoints = function(t, o, e) {
    ;(this.type = doubleArrowDefualParam.type),
      (this.headHeightFactor = doubleArrowDefualParam.headHeightFactor),
      (this.headWidthFactor = doubleArrowDefualParam.headWidthFactor),
      (this.neckHeightFactor = doubleArrowDefualParam.neckHeightFactor),
      (this.neckWidthFactor = doubleArrowDefualParam.neckWidthFactor)
    var r = P.PlotUtils.getBaseLength(t),
      n = r * this.headHeightFactor,
      g = t[t.length - 1],
      i = (P.PlotUtils.distance(o, e), n * this.headWidthFactor),
      s = n * this.neckWidthFactor,
      a = n * this.neckHeightFactor,
      l = P.PlotUtils.getThirdPoint(t[t.length - 2], g, 0, n, !0),
      u = P.PlotUtils.getThirdPoint(t[t.length - 2], g, 0, a, !0),
      c = P.PlotUtils.getThirdPoint(g, l, P.Constants.HALF_PI, i, !1),
      p = P.PlotUtils.getThirdPoint(g, l, P.Constants.HALF_PI, i, !0),
      h = P.PlotUtils.getThirdPoint(g, u, P.Constants.HALF_PI, s, !1),
      d = P.PlotUtils.getThirdPoint(g, u, P.Constants.HALF_PI, s, !0)
    return [h, c, g, p, d]
  }),
  (xp.algorithm.getArrowBodyPoints = function(t, o, e, r) {
    for (
      var n = P.PlotUtils.wholeDistance(t),
        g = P.PlotUtils.getBaseLength(t),
        i = g * r,
        s = P.PlotUtils.distance(o, e),
        a = (i - s) / 2,
        l = 0,
        u = [],
        c = [],
        p = 1;
      p < t.length - 1;
      p++
    ) {
      var h = P.PlotUtils.getAngleOfThreePoints(t[p - 1], t[p], t[p + 1]) / 2
      l += P.PlotUtils.distance(t[p - 1], t[p])
      var d = (i / 2 - (l / n) * a) / Math.sin(h),
        f = P.PlotUtils.getThirdPoint(t[p - 1], t[p], Math.PI - h, d, !0),
        E = P.PlotUtils.getThirdPoint(t[p - 1], t[p], h, d, !1)
      u.push(f), c.push(E)
    }
    return u.concat(c)
  }),
  (xp.algorithm.getTempPoint4 = function(t, o, e) {
    var r,
      n,
      g,
      i,
      s = P.PlotUtils.mid(t, o),
      a = P.PlotUtils.distance(s, e),
      l = P.PlotUtils.getAngleOfThreePoints(t, s, e)
    return (
      l < P.Constants.HALF_PI
        ? ((n = a * Math.sin(l)),
          (g = a * Math.cos(l)),
          (i = P.PlotUtils.getThirdPoint(t, s, P.Constants.HALF_PI, n, !1)),
          (r = P.PlotUtils.getThirdPoint(s, i, P.Constants.HALF_PI, g, !0)))
        : l >= P.Constants.HALF_PI && l < Math.PI
        ? ((n = a * Math.sin(Math.PI - l)),
          (g = a * Math.cos(Math.PI - l)),
          (i = P.PlotUtils.getThirdPoint(t, s, P.Constants.HALF_PI, n, !1)),
          (r = P.PlotUtils.getThirdPoint(s, i, P.Constants.HALF_PI, g, !1)))
        : l >= Math.PI && l < 1.5 * Math.PI
        ? ((n = a * Math.sin(l - Math.PI)),
          (g = a * Math.cos(l - Math.PI)),
          (i = P.PlotUtils.getThirdPoint(t, s, P.Constants.HALF_PI, n, !0)),
          (r = P.PlotUtils.getThirdPoint(s, i, P.Constants.HALF_PI, g, !0)))
        : ((n = a * Math.sin(2 * Math.PI - l)),
          (g = a * Math.cos(2 * Math.PI - l)),
          (i = P.PlotUtils.getThirdPoint(t, s, P.Constants.HALF_PI, n, !0)),
          (r = P.PlotUtils.getThirdPoint(s, i, P.Constants.HALF_PI, g, !1))),
      r
    )
  }),
  (xp.algorithm.tailedAttackArrow = function(inputPoint) {
    inputPoint = xp.algorithm.dereplication(inputPoint)
    this.tailWidthFactor = tailedAttackArrowDefualParam.tailWidthFactor
    this.swallowTailFactor = tailedAttackArrowDefualParam.swallowTailFactor
    this.swallowTailPnt = tailedAttackArrowDefualParam.swallowTailPnt
    //控制点
    var result = {
      controlPoint: null,
      polygonalPoint: null
    }
    result.controlPoint = inputPoint
    var t = inputPoint.length
    if (!(2 > t)) {
      if (2 == inputPoint.length) {
        result.polygonalPoint = inputPoint
        return result
      }
      var o = inputPoint,
        e = o[0],
        r = o[1]
      P.PlotUtils.isClockWise(o[0], o[1], o[2]) && ((e = o[1]), (r = o[0]))
      var n = P.PlotUtils.mid(e, r),
        g = [n].concat(o.slice(2)),
        i = xp.algorithm.getAttackArrowHeadPoints(g, e, r, tailedAttackArrowDefualParam),
        s = i[0],
        a = i[4],
        l = P.PlotUtils.distance(e, r),
        u = P.PlotUtils.getBaseLength(g),
        c = u * this.tailWidthFactor * this.swallowTailFactor
      this.swallowTailPnt = P.PlotUtils.getThirdPoint(g[1], g[0], 0, c, !0)
      var p = l / u,
        h = xp.algorithm.getAttackArrowBodyPoints(g, s, a, p),
        t = h.length,
        d = [e].concat(h.slice(0, t / 2))
      d.push(s)
      var f = [r].concat(h.slice(t / 2, t))
      var newArray = []
      f.push(a),
        (d = P.PlotUtils.getQBSplinePoints(d)),
        (f = P.PlotUtils.getQBSplinePoints(f)),
        (newArray = xp.algorithm.array2Dto1D(d.concat(i, f.reverse(), [this.swallowTailPnt, d[0]])))
      result.polygonalPoint = Cesium.Cartesian3.fromDegreesArray(newArray)
    }
    return result
  }),
  (xp.algorithm.getAttackArrowHeadPoints = function(t, o, e, defaultParam) {
    this.headHeightFactor = defaultParam.headHeightFactor
    this.headTailFactor = defaultParam.headTailFactor
    this.headWidthFactor = defaultParam.headWidthFactor
    this.neckWidthFactor = defaultParam.neckWidthFactor
    this.neckHeightFactor = defaultParam.neckHeightFactor
    var r = P.PlotUtils.getBaseLength(t),
      n = r * this.headHeightFactor,
      g = t[t.length - 1]
    r = P.PlotUtils.distance(g, t[t.length - 2])
    var i = P.PlotUtils.distance(o, e)
    n > i * this.headTailFactor && (n = i * this.headTailFactor)
    var s = n * this.headWidthFactor,
      a = n * this.neckWidthFactor
    n = n > r ? r : n
    var l = n * this.neckHeightFactor,
      u = P.PlotUtils.getThirdPoint(t[t.length - 2], g, 0, n, !0),
      c = P.PlotUtils.getThirdPoint(t[t.length - 2], g, 0, l, !0),
      p = P.PlotUtils.getThirdPoint(g, u, P.Constants.HALF_PI, s, !1),
      h = P.PlotUtils.getThirdPoint(g, u, P.Constants.HALF_PI, s, !0),
      d = P.PlotUtils.getThirdPoint(g, c, P.Constants.HALF_PI, a, !1),
      f = P.PlotUtils.getThirdPoint(g, c, P.Constants.HALF_PI, a, !0)
    return [d, p, g, h, f]
  }),
  (xp.algorithm.getAttackArrowBodyPoints = function(t, o, e, r) {
    for (
      var n = P.PlotUtils.wholeDistance(t),
        g = P.PlotUtils.getBaseLength(t),
        i = g * r,
        s = P.PlotUtils.distance(o, e),
        a = (i - s) / 2,
        l = 0,
        u = [],
        c = [],
        p = 1;
      p < t.length - 1;
      p++
    ) {
      var h = P.PlotUtils.getAngleOfThreePoints(t[p - 1], t[p], t[p + 1]) / 2
      l += P.PlotUtils.distance(t[p - 1], t[p])
      var d = (i / 2 - (l / n) * a) / Math.sin(h),
        f = P.PlotUtils.getThirdPoint(t[p - 1], t[p], Math.PI - h, d, !0),
        E = P.PlotUtils.getThirdPoint(t[p - 1], t[p], h, d, !1)
      u.push(f), c.push(E)
    }
    return u.concat(c)
  }),
  (xp.algorithm.dereplication = function(array) {
    var last = array[array.length - 1]
    var change = false
    var newArray = []
    newArray = array.filter(function(i) {
      if (i[0] != last[0] && i[1] != last[1]) {
        return i
      }
      change = true
    })
    if (change) newArray.push(last)
    return newArray
  }),
  (xp.algorithm.fineArrow = function(tailPoint, headerPoint) {
    if (tailPoint.length < 2 || headerPoint.length < 2) return
    //画箭头的函数
    let tailWidthFactor = fineArrowDefualParam.tailWidthFactor
    let neckWidthFactor = fineArrowDefualParam.neckWidthFactor
    let headWidthFactor = fineArrowDefualParam.headWidthFactor
    let headAngle = fineArrowDefualParam.headAngle
    let neckAngle = fineArrowDefualParam.neckAngle
    var o = []
    o[0] = tailPoint
    o[1] = headerPoint
    ;(e = o[0]),
      (r = o[1]),
      (n = P.PlotUtils.getBaseLength(o)),
      (g = n * tailWidthFactor),
      //尾部宽度因子
      (i = n * neckWidthFactor),
      //脖子宽度银子
      (s = n * headWidthFactor),
      //头部宽度因子
      (a = P.PlotUtils.getThirdPoint(r, e, P.Constants.HALF_PI, g, !0)),
      (l = P.PlotUtils.getThirdPoint(r, e, P.Constants.HALF_PI, g, !1)),
      (u = P.PlotUtils.getThirdPoint(e, r, headAngle, s, !1)),
      (c = P.PlotUtils.getThirdPoint(e, r, headAngle, s, !0)),
      (p = P.PlotUtils.getThirdPoint(e, r, neckAngle, i, !1)),
      (h = P.PlotUtils.getThirdPoint(e, r, neckAngle, i, !0)),
      (d = [])
    d.push(a[0], a[1], p[0], p[1], u[0], u[1], r[0], r[1], c[0], c[1], h[0], h[1], l[0], l[1], e[0], e[1])
    return Cesium.Cartesian3.fromDegreesArray(d)
  })

window.GlobeTooltip = function(frameDiv) {
  this.init.apply(this, arguments)
}

GlobeTooltip.prototype = {
  _frameDiv: null,
  _div: null,
  _title: null,
  init: function(frameDiv) {
    var _this = this

    var div = document.createElement('DIV')
    div.className = 'twipsy'
    div.style = `display: block;position: absolute;visibility: visible;max-width: 200px;
    min-width: 100px;padding: 5px;font-size: 11px;z-index: 1000;
    opacity: 0.8;-khtml-opacity: 0.8;-moz-opacity: 0.8;filter: alpha(opacity=80);`

    var arrow = document.createElement('DIV')
    arrow.className = 'twipsy-arrow'
    arrow.style = `position: absolute;width: 0;height: 0;top: 50%;
    left: 0;margin-top: -5px;border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;border-right: 5px solid #000000;`
    div.appendChild(arrow)

    var title = document.createElement('DIV')
    title.className = 'twipsy-inner'
    title.style = `padding: 3px 8px;background-color: #000000;color: white;text-align: center;max-width: 200px;
    text-decoration: none;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;`
    div.appendChild(title)

    frameDiv.appendChild(div)

    _this._div = div
    _this._title = title
    _this._frameDiv = frameDiv
  },
  setVisible: function(visible) {
    this._div.style.display = visible ? 'block' : 'none'
  },
  showAt: function(position, message) {
    if (position && message) {
      this.setVisible(true)
      this._title.innerHTML = message
      this._div.style.left = position.x + 10 + 'px'
      this._div.style.top = position.y - this._div.clientHeight / 2 + 'px'
    }
  }
}
