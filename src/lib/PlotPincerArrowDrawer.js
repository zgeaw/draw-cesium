export default class PlotPincerArrowDrawer {
  constructor(viewer, actionTitle) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.clock = viewer.clock
    this.canvas = viewer.scene.canvas
    this.camera = viewer.scene.camera
    this.ellipsoid = viewer.scene.globe.ellipsoid
    this.tooltip = new GlobeTooltip(viewer.container)
    this.GlobeMessageBox = new GlobeMessageBox(viewer.container, actionTitle)
    this.entity = null
    this.positions = []
    this.tempPositions = []
    this.drawHandler = null
    this.modifyHandler = null
    this.okHandler = null
    this.cancelHandler = null
    this.dragIcon = 'images/circle_gray.png'
    this.dragIconLight = 'images/circle_red.png'
    this.material = null
    this.outlineMaterial = null
    this.fill = true
    this.outline = true
    this.outlineWidth = 2
    this.extrudedHeight = 0
    this.toolBarIndex = null
    this.markers = {}
    this.layerId = 'globeDrawerLayer'
    this.actionTitle = actionTitle
  }
  clear() {
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    if (this.modifyHandler) {
      this.modifyHandler.destroy()
      this.modifyHandler = null
    }
    this._clearMarkers(this.layerId)
    this.tooltip.setVisible(false)
  }
  showModifyPincerArrow(custom, okHandler, cancelHandler) {
    let arr = []
    for (let i = 0; i < custom.length; i++) {
      let p = custom[i]
      let c = Cesium.Cartesian3.fromDegrees(p[0], p[1])
      arr.push(c)
    }
    this.positions = arr
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this._showModifyRegion2Map()
  }
  startDrawPincerArrow(okHandler, cancelHandler) {
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this.positions = []
    let floatingPoint = null
    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)
    this.drawHandler.setInputAction(event => {
      let position = event.position
      if (!Cesium.defined(position)) {
        return
      }
      let ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      let num = this.positions.length
      if (num == 0) {
        this.positions.push(cartesian)
        floatingPoint = this._createPoint(cartesian, -1)
        this._showRegion2Map()
      }
      this.positions.push(cartesian)
      let oid = this.positions.length - 2
      this._createPoint(cartesian, oid)

      if (this.positions.length > 5) {
        this.positions.pop()
        this.viewer.entities.remove(floatingPoint)
        this.tooltip.setVisible(false)
        this._startModify()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.drawHandler.setInputAction(event => {
      let position = event.endPosition
      if (!Cesium.defined(position)) {
        return
      }
      if (this.positions.length < 1) {
        this.tooltip.showAt(position, '<p>选择起点</p>')
        return
      }
      this.tooltip.showAt(position, '<p>新增控制点</p>')

      let ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      floatingPoint.position.setValue(cartesian)
      this.positions.pop()
      this.positions.push(cartesian)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  _startModify() {
    let isMoving = false
    let pickedAnchor = null
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    this._createToolBar()

    this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.modifyHandler.setInputAction(event => {
      let position = event.position
      if (!Cesium.defined(position)) {
        return
      }
      let ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      if (isMoving) {
        isMoving = false
        pickedAnchor.position.setValue(cartesian)
        let oid = pickedAnchor.oid
        this.positions[oid] = cartesian
        this.tooltip.setVisible(false)
      } else {
        let pickedObject = this.scene.pick(position)
        if (!Cesium.defined(pickedObject)) {
          return
        }
        if (!Cesium.defined(pickedObject.id)) {
          return
        }
        let entity = pickedObject.id
        if (entity.layerId != this.layerId || entity.flag != 'anchor') {
          return
        }
        pickedAnchor = entity
        isMoving = true
        this.tooltip.showAt(position, '<p>移动控制点</p>')
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.modifyHandler.setInputAction(event => {
      if (!isMoving) {
        return
      }
      let position = event.endPosition
      if (!Cesium.defined(position)) {
        return
      }
      this.tooltip.showAt(position, '<p>移动控制点</p>')

      let ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      pickedAnchor.position.setValue(cartesian)
      let oid = pickedAnchor.oid
      this.positions[oid] = cartesian
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  _showRegion2Map() {
    if (this.material == null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.outlineMaterial == null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
    }

    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        try {
          let lonLats = this._getLonLatArr(this.positions)
          //去重
          this._removeDuplicate(lonLats)
          let doubleArrow = xp.algorithm.doubleArrow(lonLats)
          let positions = doubleArrow.polygonalPoint
          if (!Cesium.defined(positions)) {
            return null
          }
          if (positions == null || positions.length < 3) {
            return null
          }
          let pHierarchy = new Cesium.PolygonHierarchy(positions)
          return pHierarchy
        } catch (err) {
          return null
        }
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length < 3) {
        return null
      }
      try {
        let lonLats = this._getLonLatArr(this.positions)
        //去重
        this._removeDuplicate(lonLats)
        let doubleArrow = xp.algorithm.doubleArrow(lonLats)
        let positions = doubleArrow.polygonalPoint
        if (!Cesium.defined(positions)) {
          return null
        }
        if (positions == null || positions.length < 3) {
          return null
        }
        let firstPoint = positions[0]
        positions.push(firstPoint)
        return positions
      } catch (err) {
        return null
      }
    }, false)
    let bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: this.material,
        show: this.fill
      }),
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: this.outlineWidth,
        material: this.outlineMaterial,
        show: this.outline
      }
    }
    if (this.extrudedHeight > 0) {
      bData.polygon.extrudedHeight = this.extrudedHeight
      bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
      bData.polygon.closeTop = true
      bData.polygon.closeBottom = true
    }
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
  }
  _showModifyRegion2Map() {
    this._startModify()
    this._computeTempPositions()

    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        try {
          let lonLats = this._getLonLatArr(this.positions)
          //去重
          this._removeDuplicate(lonLats)
          let doubleArrow = xp.algorithm.doubleArrow(lonLats)
          let positions = doubleArrow.polygonalPoint
          if (!Cesium.defined(positions)) {
            return null
          }
          if (positions == null || positions.length < 3) {
            return null
          }
          let pHierarchy = new Cesium.PolygonHierarchy(positions)
          return pHierarchy
        } catch (err) {
          return null
        }
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length < 3) {
        return null
      }
      try {
        let lonLats = this._getLonLatArr(this.positions)
        //去重
        this._removeDuplicate(lonLats)
        let doubleArrow = xp.algorithm.doubleArrow(lonLats)
        let positions = doubleArrow.polygonalPoint
        if (positions == null || positions.length < 2) {
          return null
        }
        let firstPoint = positions[0]
        positions.push(firstPoint)
        return positions
      } catch (err) {
        return null
      }
    }, false)

    if (this.material == null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.outlineMaterial == null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
    }
    let bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: this.material,
        show: this.fill
      }),
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: this.outlineWidth,
        material: this.outlineMaterial,
        show: this.outline
      }
    }
    if (this.extrudedHeight > 0) {
      bData.polygon.extrudedHeight = this.extrudedHeight
      bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
      bData.polygon.closeTop = true
      bData.polygon.closeBottom = true
    }
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
    let positions = this.positions
    for (let i = 0; i < positions.length; i++) {
      this._createPoint(positions[i], i)
    }
  }
  _removeDuplicate(lonLats) {
    if (!lonLats || lonLats.length < 2) {
      return
    }
    for (let i = 1; i < lonLats.length; i++) {
      let p1 = lonLats[i - 1]
      let p2 = lonLats[i]
      if (p2[0] == p1[0] && p2[1] == p1[1]) {
        lonLats.splice(i, 1)
        i--
      }
    }
  }
  _createPoint(cartesian, oid) {
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIconLight
      }
    })
    point.oid = oid
    point.layerId = this.layerId
    point.flag = 'anchor'
    this.markers[oid] = point
    return point
  }
  _computeTempPositions() {
    let pnts = [].concat(this.positions)
    let num = pnts.length
    let first = pnts[0]
    let last = pnts[num - 1]
    if (this._isSimpleXYZ(first, last) == false) {
      pnts.push(first)
      num += 1
    }
    this.tempPositions = []
    for (let i = 1; i < num; i++) {
      let p1 = pnts[i - 1]
      let p2 = pnts[i]
      let cp = this._computeCenterPotition(p1, p2)
      this.tempPositions.push(p1)
      this.tempPositions.push(cp)
    }
  }
  _computeCenterPotition(p1, p2) {
    let c1 = this.ellipsoid.cartesianToCartographic(p1)
    let c2 = this.ellipsoid.cartesianToCartographic(p2)
    let cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5)
    let cp = this.ellipsoid.cartographicToCartesian(cm)
    return cp
  }
  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        this.clear()
        if (this.okHandler) {
          let lonLats = this._getLonLatArr(this.positions)
          let doubleArrow = xp.algorithm.doubleArrow(lonLats)
          let positions = doubleArrow.polygonalPoint
          let custom = doubleArrow.controlPoint
          this.okHandler(positions, custom)
        }
      },
      cancelClick: () =>{
        this.clear()
        if (this.cancelHandler) {
          this.cancelHandler()
        }
      }
    })
  }
  _getLonLat(cartesian) {
    let cartographic = this.ellipsoid.cartesianToCartographic(cartesian)
    cartographic.height = this.viewer.scene.globe.getHeight(cartographic)
    let pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height
    }
    pos.lon = Cesium.Math.toDegrees(pos.lon)
    pos.lat = Cesium.Math.toDegrees(pos.lat)
    return pos
  }
  _getLonLatArr(positions) {
    let arr = []
    for (let i = 0; i < positions.length; i++) {
      let p = this._getLonLat(positions[i])
      if (p != null) {
        arr.push([p.lon, p.lat])
      }
    }
    return arr
  }
  _isSimpleXYZ(p1, p2) {
    if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) {
      return true
    }
    return false
  }
  _clearMarkers(layerName) {
    let viewer = this.viewer
    let entityList = viewer.entities.values
    if (entityList == null || entityList.length < 1) return
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i]
      if (entity.layerId == layerName) {
        viewer.entities.remove(entity)
        i--
      }
    }
  }
  _clearAnchors() {
    for (let key in this.markers) {
      let m = this.markers[key]
      this.viewer.entities.remove(m)
    }
    this.markers = {}
  }
}
