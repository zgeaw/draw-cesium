const turf = require('@turf/turf')
window.turf = turf
import './lib/plotUtil'
import './lib/Dialog'
import GlobePointDrawer from './lib/GlobePointDrawer'
import GlobePolylineDrawer from './lib/GlobePolylineDrawer'
import GlobeRectangleDrawer from './lib/GlobeRectangleDrawer'
import GlobePolygonDrawer from './lib/GlobePolygonDrawer'
import GlobeCircleDrawer from './lib/GlobeCircleDrawer'
import PlotStraightArrowDrawer from './lib/PlotStraightArrowDrawer'
import PlotAttackArrowDrawer from './lib/PlotAttackArrowDrawer'
import PlotPincerArrowDrawer from './lib/PlotPincerArrowDrawer'
import GlobePointMeasure from './lib/GlobePointMeasure'
import GlobePolylineSpaceMeasure from './lib/GlobePolylineSpaceMeasure'
import GlobePolylineStickMeasure from './lib/GlobePolylineStickMeasure'
import GlobePolygonMeasure from './lib/GlobePolygonMeasure'
export default class DrawTools {
  constructor(viewer) {
    this.viewer = viewer
    this.ctrArr = []
    this.pointDrawer = null
    this.polylineDrawer = null
    this.polygonDrawer = null
    this.circleDrawer = null
    this.rectDrawer = null
    this.bufferLineDrawer = null
    this.straightArrowDrawer = null
    this.attackArrowDrawer = null
    this.pincerArrowDrawer = null

    this.posMeasure = null
    this.spaceDisMeasure = null
    this.stickDisMeasure = null
    this.areaMeasure = null
    this.actionTitle = '操作完成？'
  }
  // 初始化
  init() {
    this.pointDrawer = new GlobePointDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.pointDrawer)

    this.polylineDrawer = new GlobePolylineDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.polylineDrawer)

    this.polygonDrawer = new GlobePolygonDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.polygonDrawer)

    this.circleDrawer = new GlobeCircleDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.circleDrawer)

    this.rectDrawer = new GlobeRectangleDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.rectDrawer)

    this.straightArrowDrawer = new PlotStraightArrowDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.straightArrowDrawer)

    this.attackArrowDrawer = new PlotAttackArrowDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.attackArrowDrawer)

    this.pincerArrowDrawer = new PlotPincerArrowDrawer(this.viewer, this.actionTitle)
    this.ctrArr.push(this.pincerArrowDrawer)

    this.posMeasure = new GlobePointMeasure(this.viewer, this.actionTitle)
    this.ctrArr.push(this.posMeasure)

    this.spaceDisMeasure = new GlobePolylineSpaceMeasure(this.viewer, this.actionTitle)
    this.ctrArr.push(this.spaceDisMeasure)

    this.stickDisMeasure = new GlobePolylineStickMeasure(this.viewer, this.actionTitle)
    this.ctrArr.push(this.stickDisMeasure)

    this.areaMeasure = new GlobePolygonMeasure(this.viewer, this.actionTitle)
    this.ctrArr.push(this.areaMeasure)
  }

  clear() {
    for (let i = 0; i < this.ctrArr.length; i++) {
      try {
        let ctr = this.ctrArr[i]
        if (ctr.clear) {
          ctr.clear()
        }
      } catch (err) {
        console.log('发生未知出错：GlobeTracker.clear')
      }
    }
  }

  // 坐标查询
  pickPosition(okHandler, cancelHandler) {
    this.clear()
    if (this.posMeasure === null) {
      this.posMeasure = new GlobePointMeasure(this.viewer, this.actionTitle)
      this.ctrArr.push(this.posMeasure)
    }
    this.posMeasure.startDrawPoint(okHandler, cancelHandler)
  }

  // 空间距离
  pickSpaceDistance(okHandler, cancelHandler) {
    this.clear()
    if (this.spaceDisMeasure === null) {
      this.spaceDisMeasure = new GlobePolylineSpaceMeasure(this.viewer, this.actionTitle)
      this.ctrArr.push(this.spaceDisMeasure)
    }
    this.spaceDisMeasure.startDrawPolyline(okHandler, cancelHandler)
  }

  // 贴地距离
  pickStickDistance(okHandler, cancelHandler) {
    this.clear()
    if (this.stickDisMeasure === null) {
      this.stickDisMeasure = new GlobePolylineStickMeasure(this.viewer, this.actionTitle)
      this.ctrArr.push(this.stickDisMeasure)
    }
    this.stickDisMeasure.startDrawPolyline(okHandler, cancelHandler)
  }

  // 面积量算
  pickArea(okHandler, cancelHandler) {
    this.clear()
    if (this.areaMeasure === null) {
      this.areaMeasure = new GlobePolygonMeasure(this.viewer, this.actionTitle)
      this.ctrArr.push(this.areaMeasure)
    }
    this.areaMeasure.startDrawPolygon(okHandler, cancelHandler)
  }

  trackPoint(okHandler, cancelHandler) {
    this.clear()
    if (this.pointDrawer === null) {
      this.pointDrawer = new GlobePointDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.pointDrawer)
    }
    this.pointDrawer.startDrawPoint(okHandler, cancelHandler)
  }

  trackPolyline(okHandler, cancelHandler) {
    this.clear()
    if (this.polylineDrawer === null) {
      this.polylineDrawer = new GlobePolylineDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.polylineDrawer)
    }
    this.polylineDrawer.startDrawPolyline(okHandler, cancelHandler)
  }

  trackPolygon(okHandler, cancelHandler) {
    this.clear()
    if (this.polygonDrawer === null) {
      this.polygonDrawer = new GlobePolygonDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.polygonDrawer)
    }
    this.polygonDrawer.startDrawPolygon(okHandler, cancelHandler)
  }

  trackCircle(okHandler, cancelHandler) {
    this.clear()
    if (this.circleDrawer === null) {
      this.circleDrawer = new GlobeCircleDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.circleDrawer)
    }
    this.circleDrawer.startDrawCircle(okHandler, cancelHandler)
  }

  trackRectangle(okHandler, cancelHandler) {
    if (this.rectDrawer === null) {
      this.rectDrawer = new GlobeRectangleDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.rectDrawer)
    }
    this.clear()
    this.rectDrawer.startDrawRectangle(okHandler, cancelHandler)
  }

  trackStraightArrow(okHandler, cancelHandler) {
    this.clear()
    if (this.straightArrowDrawer === null) {
      this.straightArrowDrawer = new PlotStraightArrowDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.straightArrowDrawer)
    }
    this.straightArrowDrawer.startDrawStraightArrow(okHandler, cancelHandler)
  }

  trackAttackArrow(okHandler, cancelHandler) {
    this.clear()
    if (this.attackArrowDrawer === null) {
      this.attackArrowDrawer = new PlotAttackArrowDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.attackArrowDrawer)
    }
    this.attackArrowDrawer.startDrawAttackArrow(okHandler, cancelHandler)
  }

  trackPincerArrow(okHandler, cancelHandler) {
    this.clear()
    if (this.pincerArrowDrawer === null) {
      this.pincerArrowDrawer = new PlotPincerArrowDrawer(this.viewer, this.actionTitle)
      this.ctrArr.push(this.pincerArrowDrawer)
    }
    this.pincerArrowDrawer.startDrawPincerArrow(okHandler, cancelHandler)
  }
}
