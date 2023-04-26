export default class GlobeCircleDrawer {
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
    this.outlineEntity = null
    this.positions = []
    this.drawHandler = null
    this.modifyHandler = null
    this.okHandler = null
    this.cancelHandler = null
    this.dragIcon = 'images/circle_center.png'
    this.dragIconLight = 'images/circle_red.png'
    this.material = null
    this.radiusLineMaterial = null
    this.outlineMaterial = null
    this.fill = true
    this.outline = true
    this.outlineWidth = 3
    this.extrudedHeight = 0
    this.toolBarIndex = null
    this.layerId = 'globeEntityDrawerLayer'
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
  showModifyCircle(positions, okHandler, cancelHandler) {
    this.positions = positions
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this._showModifyRegion2Map()
    this._showCircleOutline2Map()
    this._startModify()
  }
  startDrawCircle(okHandler, cancelHandler) {
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
      if (num === 0) {
        this.positions.push(cartesian)
        this._createCenter(cartesian, 0)
        floatingPoint = this._createPoint(cartesian, -1)
        this._showRegion2Map()
        this._showCircleOutline2Map()
      }
      this.positions.push(cartesian)
      if (num > 0) {
        this._createPoint(cartesian, 1)
      }
      if (num > 1) {
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
      this.tooltip.showAt(position, '<p>选择终点</p>')

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
        if (entity.layerId !== this.layerId || entity.flag !== 'anchor') {
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
  _createCenter(cartesian, oid) {
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIcon,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })
    point.oid = oid
    point.layerId = this.layerId
    point.flag = 'anchor'
    return point
  }
  _createPoint(cartesian, oid) {
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIconLight,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })
    point.oid = oid
    point.layerId = this.layerId
    point.flag = 'anchor'
    return point
  }
  _showRegion2Map() {
    if (this.material === null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.radiusLineMaterial === null) {
      this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
    }
    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let dis = this._computeCircleRadius3D(this.positions)
        dis = (dis / 1000).toFixed(3)
        this.entity.label.text = dis + 'km'
        let pnts = this._computeCirclePolygon(this.positions)
        let pHierarchy = new Cesium.PolygonHierarchy(pnts)
        return pHierarchy
      } else {
        return null
      }
    }, false)
    let lineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        return this.positions
      } else {
        return null
      }
    }, false)
    let labelDynamicPosition = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let p1 = this.positions[0]
        let p2 = this.positions[1]
        let cp = this._computeCenterPotition(p1, p2)
        return cp
      } else {
        return null
      }
    }, false)
    let bData = {
      position: labelDynamicPosition,
      label: {
        text: '',
        font: '14px Helvetica',
        fillColor: Cesium.Color.SKYBLUE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -9000)),
        pixelOffset: new Cesium.Cartesian2(16, 16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: this.material,
        fill: this.fill,
        outline: this.outline,
        outlineWidth: this.outlineWidth,
        outlineColor: this.outlineColor,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }),
      polyline: {
        positions: lineDynamicPositions,
        clampToGround: true,
        width: 2,
        material: this.radiusLineMaterial,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
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
    if (this.material === null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.radiusLineMaterial === null) {
      this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
    }
    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      let dis = this._computeCircleRadius3D(this.positions)
      dis = (dis / 1000).toFixed(3)
      this.entity.label.text = dis + 'km'
      let pnts = this._computeCirclePolygon(this.positions)
      let pHierarchy = new Cesium.PolygonHierarchy(pnts)
      return pHierarchy
    }, false)
    let lineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        return this.positions
      } else {
        return null
      }
    }, false)
    let labelDynamicPosition = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let p1 = this.positions[0]
        let p2 = this.positions[1]
        let cp = this._computeCenterPotition(p1, p2)
        return cp
      } else {
        return null
      }
    }, false)
    let dis = this._computeCircleRadius3D(this.positions)
    dis = (dis / 1000).toFixed(3) + 'km'
    let bData = {
      position: labelDynamicPosition,
      label: {
        text: dis,
        font: '14px Helvetica',
        fillColor: Cesium.Color.SKYBLUE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -9000)),
        pixelOffset: new Cesium.Cartesian2(16, 16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: this.material,
        fill: this.fill,
        outline: this.outline,
        outlineWidth: this.outlineWidth,
        outlineColor: this.outlineColor,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }),
      polyline: {
        positions: lineDynamicPositions,
        clampToGround: true,
        width: 2,
        material: this.radiusLineMaterial,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
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
    this._createCenter(this.positions[0], 0)
    this._createPoint(this.positions[1], 1)
  }
  _showCircleOutline2Map() {
    if (this.outlineMaterial === null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
    }
    let outelinePositions = new Cesium.CallbackProperty(() => {
      let pnts = this._computeCirclePolygon(this.positions)
      return pnts
    }, false)
    let bData = {
      polyline: {
        positions: outelinePositions,
        clampToGround: true,
        width: this.outlineWidth,
        material: this.outlineMaterial,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    }
    this.outlineEntity = this.viewer.entities.add(bData)
    this.outlineEntity.layerId = this.layerId
  }
  _computeCenterPotition(p1, p2) {
    let c1 = this.ellipsoid.cartesianToCartographic(p1)
    let c2 = this.ellipsoid.cartesianToCartographic(p2)
    let cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5)
    let cp = this.ellipsoid.cartographicToCartesian(cm)
    return cp
  }
  _computeCirclePolygon(positions) {
    try {
      if (!positions || positions.length < 2) {
        return null
      }
      let cp = positions[0]
      let r = this._computeCircleRadius3D(positions)
      let pnts = this._computeCirclePolygon2(cp, r)
      return pnts
    } catch (err) {
      return null
    }
  }
  _computeCirclePolygon2(center, radius) {
    try {
      if (!center || radius <= 0) {
        return null
      }
      let cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions(
        {
          center: center,
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          rotation: 0,
          granularity: 0.005
        },
        false,
        true
      )
      if (!cep || !cep.outerPositions) {
        return null
      }
      let pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions)
      let first = pnts[0]
      pnts[pnts.length] = first
      return pnts
    } catch (err) {
      return null
    }
  }
  _computeCirclePolygon3(center, semiMajorAxis, semiMinorAxis, rotation) {
    try {
      if (!center || semiMajorAxis <= 0 || semiMinorAxis <= 0) {
        return null
      }
      let cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions(
        {
          center: center,
          semiMajorAxis: semiMajorAxis,
          semiMinorAxis: semiMinorAxis,
          rotation: rotation,
          granularity: 0.005
        },
        false,
        true
      )
      if (!cep || !cep.outerPositions) {
        return null
      }
      let pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions)
      let first = pnts[0]
      pnts[pnts.length] = first
      return pnts
    } catch (err) {
      return null
    }
  }
  _computeCirclePolygonForDegree(positions) {
    let cp = this.ellipsoid.cartesianToCartographic(positions[0])
    let rp = this.ellipsoid.cartesianToCartographic(positions[1])
    let x0 = cp.longitude
    let y0 = cp.latitude
    let xr = rp.longitude
    let yr = rp.latitude
    let r = Math.sqrt(Math.pow(x0 - xr, 2) + Math.pow(y0 - yr, 2))

    let pnts = []
    for (let i = 0; i < 360; i++) {
      let x1 = x0 + r * Math.cos((i * Math.PI) / 180)
      let y1 = y0 + r * Math.sin((i * Math.PI) / 180)
      let p1 = Cesium.Cartesian3.fromRadians(x1, y1)
      pnts.push(p1)
    }
    return pnts
  }
  _computeCircleRadius3D(positions) {
    let c1 = positions[0]
    let c2 = positions[1]
    let x = Math.pow(c1.x - c2.x, 2)
    let y = Math.pow(c1.y - c2.y, 2)
    let z = Math.pow(c1.z - c2.z, 2)
    let dis = Math.sqrt(x + y + z)
    return dis
  }
  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        this.clear()
        if (this.okHandler) {
          this.okHandler(this.positions)
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
  _clearMarkers(layerName) {
    let entityList = this.viewer.entities.values
    if (entityList === null || entityList.length < 1) return
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i]
      if (entity.layerId === layerName) {
        this.viewer.entities.remove(entity)
        i--
      }
    }
  }
}
