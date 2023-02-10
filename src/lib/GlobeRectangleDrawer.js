export default class GlobeRectangleDrawer {
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
    this.drawHandler = null
    this.modifyHandler = null
    this.okHandler = null
    this.cancelHandler = null
    this.dragIconLight = 'images/circle_red.png'
    this.material = null
    this.outlineMaterial = null
    this.fill = true
    this.outline = true
    this.outlineWidth = 2
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
  showModifyRectangle(positions, okHandler, cancelHandler) {
    this.positions = positions
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler

    this._showModifyRegion2Map()
    this._startModify()
  }
  startDrawRectangle(okHandler, cancelHandler) {
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
        floatingPoint = this._createPoint(cartesian, -1)
        this._showRegion2Map()
      }
      this.positions.push(cartesian)
      let oid = this.positions.length - 2
      this._createPoint(cartesian, oid)
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
    return point
  }
  _showRegion2Map() {
    if (this.material === null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.outlineMaterial === null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
    }
    let dynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let rect = Cesium.Rectangle.fromCartesianArray(this.positions)
        return rect
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let rect = Cesium.Rectangle.fromCartesianArray(this.positions)
        let arr = [
          rect.west,
          rect.north,
          rect.east,
          rect.north,
          rect.east,
          rect.south,
          rect.west,
          rect.south,
          rect.west,
          rect.north
        ]
        let positions = Cesium.Cartesian3.fromRadiansArray(arr)
        return positions
      } else {
        return null
      }
    }, false)
    let bData = {
      rectangle: {
        coordinates: dynamicPositions,
        material: this.material,
        show: this.fill
      },
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: this.outlineWidth,
        material: this.outlineMaterial,
        show: this.outline
      }
    }
    if (this.extrudedHeight > 0) {
      bData.rectangle.extrudedHeight = this.extrudedHeight
      bData.rectangle.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
      bData.rectangle.closeTop = true
      bData.rectangle.closeBottom = true
      bData.rectangle.outline = false
      bData.rectangle.outlineWidth = 0
    }
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
  }
  _showModifyRegion2Map() {
    if (this.material === null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.outlineMaterial === null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
    }
    let dynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let rect = Cesium.Rectangle.fromCartesianArray(this.positions)
        return rect
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let rect = Cesium.Rectangle.fromCartesianArray(this.positions)
        let arr = [
          rect.west,
          rect.north,
          rect.east,
          rect.north,
          rect.east,
          rect.south,
          rect.west,
          rect.south,
          rect.west,
          rect.north
        ]
        let positions = Cesium.Cartesian3.fromRadiansArray(arr)
        return positions
      } else {
        return null
      }
    }, false)
    let bData = {
      rectangle: {
        coordinates: dynamicPositions,
        material: this.material,
        show: this.fill
      },
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: this.outlineWidth,
        material: this.outlineMaterial,
        show: this.outline
      }
    }
    if (this.extrudedHeight > 0) {
      bData.rectangle.extrudedHeight = this.extrudedHeight
      bData.rectangle.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
      bData.rectangle.closeTop = true
      bData.rectangle.closeBottom = true
      bData.rectangle.outline = false
      bData.rectangle.outlineWidth = 0
    }
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
    let positions = this.positions
    for (let i = 0; i < positions.length; i++) {
      this._createPoint(positions[i], i)
    }
  }
  _computeRectangle(p1, p2) {
    let c1 = this.ellipsoid.cartesianToCartographic(p1)
    let c2 = this.ellipsoid.cartesianToCartographic(p2)
    let rect = Cesium.Rectangle.fromCartesianArray([p1, p2])
    return rect
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
  _isSimpleXYZ(p1, p2) {
    if (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z) {
      return true
    }
    return false
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
