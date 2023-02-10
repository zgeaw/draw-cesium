export default class GlobePolygonDrawer {
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
  showModifyPolygon(positions, okHandler, cancelHandler) {
    this.positions = positions
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this._showModifyRegion2Map()
  }
  startDrawPolygon(okHandler, cancelHandler) {
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler

    this.positions = []
    var floatingPoint = null
    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.drawHandler.setInputAction(event => {
      var position = event.position
      if (!Cesium.defined(position)) {
        return
      }
      var ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      var cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      var num = this.positions.length
      if (num === 0) {
        this.positions.push(cartesian)
        floatingPoint = this._createPoint(cartesian, -1)
        this._showRegion2Map()
      }
      this.positions.push(cartesian)
      var oid = this.positions.length - 2
      this._createPoint(cartesian, oid)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.drawHandler.setInputAction(event => {
      var position = event.endPosition
      if (!Cesium.defined(position)) {
        return
      }
      if (this.positions.length < 1) {
        this.tooltip.showAt(position, '<p>选择起点</p>')
        return
      }
      var num = this.positions.length
      var tip = '<p>点击添加下一个点</p>'
      if (num > 3) {
        tip += '<p>右键结束绘制</p>'
      }
      this.tooltip.showAt(position, tip)

      var ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      var cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      floatingPoint.position.setValue(cartesian)
      this.positions.pop()
      this.positions.push(cartesian)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.drawHandler.setInputAction(movement => {
      if (this.positions.length < 4) {
        return
      }
      this.positions.pop()
      this.viewer.entities.remove(floatingPoint)
      this.tooltip.setVisible(false)

      //进入编辑状态
      this.clear()
      this._showModifyRegion2Map()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }
  _startModify() {
    var isMoving = false
    var pickedAnchor = null
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    this._createToolBar()

    this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.modifyHandler.setInputAction(event => {
      var position = event.position
      if (!Cesium.defined(position)) {
        return
      }
      var ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      var cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      if (isMoving) {
        isMoving = false
        pickedAnchor.position.setValue(cartesian)
        var oid = pickedAnchor.oid
        this.tempPositions[oid] = cartesian
        this.tooltip.setVisible(false)
        if (pickedAnchor.flag === 'mid_anchor') {
          this._updateModifyAnchors(oid)
        }
      } else {
        var pickedObject = this.scene.pick(position)
        if (!Cesium.defined(pickedObject)) {
          return
        }
        if (!Cesium.defined(pickedObject.id)) {
          return
        }
        var entity = pickedObject.id
        if (entity.layerId !== this.layerId) {
          return
        }
        if (entity.flag !== 'anchor' && entity.flag !== 'mid_anchor') {
          return
        }
        pickedAnchor = entity
        isMoving = true
        if (entity.flag === 'anchor') {
          this.tooltip.showAt(position, '<p>移动控制点</p>')
        }
        if (entity.flag === 'mid_anchor') {
          this.tooltip.showAt(position, '<p>移动创建新的控制点</p>')
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.modifyHandler.setInputAction(event => {
      if (!isMoving) {
        return
      }
      var position = event.endPosition
      if (!Cesium.defined(position)) {
        return
      }
      this.tooltip.showAt(position, '<p>移动控制点</p>')

      var ray = this.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        return
      }
      var cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      var oid = pickedAnchor.oid
      if (pickedAnchor.flag === 'anchor') {
        pickedAnchor.position.setValue(cartesian)
        this.tempPositions[oid] = cartesian
        //左右两个中点
        this._updateNewMidAnchors(oid)
      } else if (pickedAnchor.flag === 'mid_anchor') {
        pickedAnchor.position.setValue(cartesian)
        this.tempPositions[oid] = cartesian
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
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
    var dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        var pHierarchy = new Cesium.PolygonHierarchy(this.positions)
        return pHierarchy
      } else {
        return null
      }
    }, false)
    var outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        var arr = [].concat(this.positions)
        var first = this.positions[0]
        arr.push(first)
        return arr
      } else {
        return null
      }
    }, false)
    var bData = {
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

    var dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        var pHierarchy = new Cesium.PolygonHierarchy(this.tempPositions)
        return pHierarchy
      } else {
        return null
      }
    }, false)
    var outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.tempPositions.length > 1) {
        var arr = [].concat(this.tempPositions)
        var first = this.tempPositions[0]
        arr.push(first)
        return arr
      } else {
        return null
      }
    }, false)
    if (this.material === null) {
      this.material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
    }
    if (this.outlineMaterial === null) {
      this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
    }
    var bData = {
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
    var positions = this.tempPositions
    for (var i = 0; i < positions.length; i++) {
      var ys = i % 2
      if (ys === 0) {
        this._createPoint(positions[i], i)
      } else {
        this._createMidPoint(positions[i], i)
      }
    }
  }
  _updateModifyAnchors(oid) {
    //重新计算tempPositions
    var p = this.tempPositions[oid]
    var p1 = null
    var p2 = null
    var num = this.tempPositions.length
    if (oid === 0) {
      p1 = this.tempPositions[num - 1]
      p2 = this.tempPositions[oid + 1]
    } else if (oid === num - 1) {
      p1 = this.tempPositions[oid - 1]
      p2 = this.tempPositions[0]
    } else {
      p1 = this.tempPositions[oid - 1]
      p2 = this.tempPositions[oid + 1]
    }
    //计算中心
    var cp1 = this._computeCenterPotition(p1, p)
    var cp2 = this._computeCenterPotition(p, p2)

    //插入点
    var arr = [cp1, p, cp2]
    this.tempPositions.splice(oid, 1, cp1, p, cp2)

    //重新加载锚点
    this._clearAnchors(this.layerId)
    var positions = this.tempPositions
    for (var i = 0; i < positions.length; i++) {
      var ys = i % 2
      if (ys === 0) {
        this._createPoint(positions[i], i)
      } else {
        this._createMidPoint(positions[i], i)
      }
    }
  }
  _updateNewMidAnchors(oid) {
    if (oid === null || oid === undefined) {
      return
    }
    //左边两个中点，oid2为临时中间点
    var oid1 = null
    var oid2 = null

    //右边两个中点，oid3为临时中间点
    var oid3 = null
    var oid4 = null
    var num = this.tempPositions.length
    if (oid === 0) {
      oid1 = num - 2
      oid2 = num - 1
      oid3 = oid + 1
      oid4 = oid + 2
    } else if (oid === num - 2) {
      oid1 = oid - 2
      oid2 = oid - 1
      oid3 = num - 1
      oid4 = 0
    } else {
      oid1 = oid - 2
      oid2 = oid - 1
      oid3 = oid + 1
      oid4 = oid + 2
    }

    var c1 = this.tempPositions[oid1]
    var c = this.tempPositions[oid]
    var c4 = this.tempPositions[oid4]

    var c2 = this._computeCenterPotition(c1, c)
    var c3 = this._computeCenterPotition(c4, c)

    this.tempPositions[oid2] = c2
    this.tempPositions[oid3] = c3

    this.markers[oid2].position.setValue(c2)
    this.markers[oid3].position.setValue(c3)
  }
  _createPoint(cartesian, oid) {
    var point = this.viewer.entities.add({
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
  _createMidPoint(cartesian, oid) {
    var point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIcon
      }
    })
    point.oid = oid
    point.layerId = this.layerId
    point.flag = 'mid_anchor'
    this.markers[oid] = point
    return point
  }
  _computeTempPositions() {
    var pnts = [].concat(this.positions)
    var num = pnts.length
    var first = pnts[0]
    var last = pnts[num - 1]
    if (this._isSimpleXYZ(first, last) === false) {
      pnts.push(first)
      num += 1
    }
    this.tempPositions = []
    for (var i = 1; i < num; i++) {
      var p1 = pnts[i - 1]
      var p2 = pnts[i]
      var cp = this._computeCenterPotition(p1, p2)
      this.tempPositions.push(p1)
      this.tempPositions.push(cp)
    }
  }
  _computeCenterPotition(p1, p2) {
    var c1 = this.ellipsoid.cartesianToCartographic(p1)
    var c2 = this.ellipsoid.cartesianToCartographic(p2)
    var cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5)
    var cp = this.ellipsoid.cartographicToCartesian(cm)
    return cp
  }
  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        this.clear()
        if (this.okHandler) {
          var positions = []
          for (var i = 0; i < this.tempPositions.length; i += 2) {
            var p = this.tempPositions[i]
            positions.push(p)
          }
          this.positions = positions
          this.okHandler(positions)
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
    var entityList = this.viewer.entities.values
    if (entityList === null || entityList.length < 1) return
    for (var i = 0; i < entityList.length; i++) {
      var entity = entityList[i]
      if (entity.layerId === layerName) {
        this.viewer.entities.remove(entity)
        i--
      }
    }
  }
  _clearAnchors() {
    for (var key in this.markers) {
      var m = this.markers[key]
      this.viewer.entities.remove(m)
    }
    this.markers = {}
  }
}
