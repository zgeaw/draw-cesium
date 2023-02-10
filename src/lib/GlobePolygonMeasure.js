export default class GlobePolygonMeasure {
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
    this.callback = null
    this.dragIcon = 'images/circle_gray.png'
    this.dragIconLight = 'images/circle_red.png'
    this.material = null
    this.outlineMaterial = null
    this.fill = true
    this.outline = true
    this.outlineWidth = 2
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
  showModifyPolygon(positions, callback) {
    this.positions = positions
    this.callback = callback
    this._showModifyRegion2Map()
  }
  startDrawPolygon(callback) {
    this.callback = callback

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
      if (this.positions.length > 2) {
        let text = this._getMeasureTip(this.positions)
        this.entity.label.text = text
      }

      this.entity.position = cartesian
      let text = this._getMeasureTip(this.positions)
      this.entity.label.text = text
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
      let num = this.positions.length
      let tip = this._getMeasureTip(this.positions)
      tip = tip.replace('\n', '<br/>')
      tip += '<p>点击添加下一个点</p>'
      if (num > 3) {
        tip += '<p>右键结束绘制</p>'
      }
      this.tooltip.showAt(position, tip)

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
      if (this.positions.length > 2) {
        let text = this._getMeasureTip(this.positions)
        this.entity.label.text = text
      }

      this.entity.position = cartesian
      let text = this._getMeasureTip(this.positions)
      this.entity.label.text = text
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
        this.tempPositions[oid] = cartesian
        this.tooltip.setVisible(false)
        if (pickedAnchor.flag === 'mid_anchor') {
          this._updateModifyAnchors(oid)
        }

        this.entity.position.setValue(cartesian)
        let text = this._getMeasureTip(this.tempPositions)
        this.entity.label.text = text
      } else {
        let pickedObject = this.scene.pick(position)
        if (!Cesium.defined(pickedObject)) {
          return
        }
        if (!Cesium.defined(pickedObject.id)) {
          return
        }
        let entity = pickedObject.id
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
      let oid = pickedAnchor.oid
      if (pickedAnchor.flag === 'anchor') {
        pickedAnchor.position.setValue(cartesian)
        this.tempPositions[oid] = cartesian
        //左右两个中点
        this._updateNewMidAnchors(oid)
      } else if (pickedAnchor.flag === 'mid_anchor') {
        pickedAnchor.position.setValue(cartesian)
        this.tempPositions[oid] = cartesian
      }

      this.entity.position.setValue(cartesian)
      let text = this._getMeasureTip(this.tempPositions)
      this.entity.label.text = text
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
    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        let pHierarchy = new Cesium.PolygonHierarchy(this.positions)
        return pHierarchy
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 1) {
        let arr = [].concat(this.positions)
        let first = this.positions[0]
        arr.push(first)
        return arr
      } else {
        return null
      }
    }, false)
    let num = this.positions.length
    let last = this.positions[num - 1]
    let bData = {
      position: last,
      label: {
        text: '',
        font: '16px "微软雅黑", Arial, Helvetica, sans-serif, Helvetica',
        fillColor: Cesium.Color.RED,
        outlineColor: Cesium.Color.SKYBLUE,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
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
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
  }
  _showModifyRegion2Map() {
    this._startModify()
    this._computeTempPositions()

    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (this.positions.length > 2) {
        let pHierarchy = new Cesium.PolygonHierarchy(this.tempPositions)
        return pHierarchy
      } else {
        return null
      }
    }, false)
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (this.tempPositions.length > 1) {
        let arr = [].concat(this.tempPositions)
        let first = this.tempPositions[0]
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
    let num = this.tempPositions.length
    let last = this.tempPositions[num - 1]
    let text = this._getMeasureTip(this.tempPositions)
    let bData = {
      position: last,
      label: {
        text: text,
        font: '16px "微软雅黑", Arial, Helvetica, sans-serif, Helvetica',
        fillColor: Cesium.Color.RED,
        outlineColor: Cesium.Color.SKYBLUE,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
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
    this.entity = this.viewer.entities.add(bData)
    this.entity.layerId = this.layerId
    let positions = this.tempPositions
    for (let i = 0; i < positions.length; i++) {
      let ys = i % 2
      if (ys === 0) {
        this._createPoint(positions[i], i)
      } else {
        this._createMidPoint(positions[i], i)
      }
    }
  }
  _updateModifyAnchors(oid) {
    //重新计算tempPositions
    let p = this.tempPositions[oid]
    let p1 = null
    let p2 = null
    let num = this.tempPositions.length
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
    let cp1 = this._computeCenterPotition(p1, p)
    let cp2 = this._computeCenterPotition(p, p2)

    //插入点
    let arr = [cp1, p, cp2]
    this.tempPositions.splice(oid, 1, cp1, p, cp2)

    //重新加载锚点
    this._clearAnchors(this.layerId)
    let positions = this.tempPositions
    for (let i = 0; i < positions.length; i++) {
      let ys = i % 2
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
    let oid1 = null
    let oid2 = null

    //右边两个中点，oid3为临时中间点
    let oid3 = null
    let oid4 = null
    let num = this.tempPositions.length
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

    let c1 = this.tempPositions[oid1]
    let c = this.tempPositions[oid]
    let c4 = this.tempPositions[oid4]

    let c2 = this._computeCenterPotition(c1, c)
    let c3 = this._computeCenterPotition(c4, c)

    this.tempPositions[oid2] = c2
    this.tempPositions[oid3] = c3

    this.markers[oid2].position.setValue(c2)
    this.markers[oid3].position.setValue(c3)
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
  _createMidPoint(cartesian, oid) {
    let point = this.viewer.entities.add({
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
    let pnts = [].concat(this.positions)
    let num = pnts.length
    let first = pnts[0]
    let last = pnts[num - 1]
    if (this._isSimpleXYZ(first, last) === false) {
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
  _getMeasureTip(pntList) {
    let dis2d = this._computeLineDis2d(pntList)
    let dis3d = this._computeLineDis3d(pntList)
    dis2d = dis2d.toFixed(3)
    dis3d = dis3d.toFixed(3)
    let tip = '周长：' + dis3d + '千米'
    if (pntList.length > 2) {
      let area = this._computeArea(pntList)
      tip += '\n 面积：' + area.toFixed(3) + '平方千米'
    }
    return tip
  }
  _computeDis2d(c1, c2) {
    let dis = Cesium.Cartesian2.distance(c1, c2) / 1000
    return dis
  }
  _computeDis3d(p1, p2) {
    let dis = Cesium.Cartesian3.distance(p1, p2) / 1000
    return dis
  }
  _computeLineDis2d(pntList) {
    let total = 0
    for (let i = 1; i < pntList.length; i++) {
      let p1 = pntList[i - 1]
      let p2 = pntList[i]
      let dis = this._computeDis2d(p1, p2)
      total += dis
    }
    return total
  }
  _computeLineDis3d(pntList) {
    let total = 0
    for (let i = 1; i < pntList.length; i++) {
      let p1 = pntList[i - 1]
      let p2 = pntList[i]
      let dis = this._computeDis3d(p1, p2)
      total += dis
    }
    return total
  }
  _cartesian2LonLat(cartesian) {
    //将笛卡尔坐标转换为地理坐标
    let cartographic = this.ellipsoid.cartesianToCartographic(cartesian)
    //将弧度转为度的十进制度表示
    let pos = {
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      alt: Math.ceil(cartographic.height)
    }
    return pos
  }
  _computeArea(positions) {
    let arr = []
    for (let i = 0; i < positions.length; i++) {
      let p = this._cartesian2LonLat(positions[i])
      arr.push([p.lon, p.lat])
    }
    arr.push(arr[0]) //终点和起点重合

    let polygon = turf.polygon([arr])
    let area = turf.area(polygon) / 1000 / 1000
    return area
  }
  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        if (this.callback) {
          let positions = []
          for (let i = 0; i < this.tempPositions.length; i += 2) {
            let p = this.tempPositions[i]
            positions.push(p)
          }
          this.positions = positions
          this.clear()
          let dis2d = this._computeLineDis2d(positions)
          let dis3d = this._computeLineDis3d(positions)
          let area = this._computeArea(positions)
          dis2d = dis2d.toFixed(3)
          dis3d = dis3d.toFixed(3)
          area = area.toFixed(3)
          let rlt = {
            dis2d: dis2d,
            dis3d: dis3d,
            area: area
          }
          this.callback(positions, rlt)
        }
      },
      cancelClick: () =>{
        this.clear()
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
  _clearAnchors() {
    for (let key in this.markers) {
      let m = this.markers[key]
      this.viewer.entities.remove(m)
    }
    this.markers = {}
  }
}
