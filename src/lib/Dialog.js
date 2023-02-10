window.GlobeMessageBox = function(frameDiv) {
  this.init.apply(this, arguments)
}

GlobeMessageBox.prototype = {
  _frameDiv: null,
  _div: null,
  _title: null,
  _btnOk: null,
  _btnCancel: null,
  init: function(frameDiv, titleMsg) {
    var _this = this

    var div = document.createElement('DIV')
    div.className = 'msg-dialog'
    div.style = `position:fixed;z-index:2000; top:30px;left:0;right:0;text-align:center;`

    var content = document.createElement('DIV')
    content.className = 'msg-dialog-box'
    content.style = `display: inline-block;width: 220px;padding-bottom: 10px;
    vertical-align: middle;background-color: #FFF;border-radius: 4px;border: 1px solid #EBEEF5;
    font-size: 18px;-webkit-box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);text-align: left;overflow: hidden;
    -webkit-backface-visibility: hidden;backface-visibility: hidden;`

    var title = document.createElement('DIV')
    title.className = 'msg-dialog-title'
    title.style = `position: relative;padding: 15px 15px 10px;text-align: center;`
    title.innerHTML = titleMsg

    var btns = document.createElement('DIV')
    btns.className = 'msg-dialog-btns'
    btns.style = `padding: 5px 15px;text-align: center;`
    var btnStyle = `display: inline-block;line-height: 1;white-space: nowrap;cursor: pointer;
    background: #FFF;border: 1px solid #DCDFE6;color: #606266;
    -webkit-appearance: none;text-align: center;-webkit-box-sizing: border-box;
    box-sizing: border-box;outline: 0;margin: 0 10px;
    -webkit-transition: .1s;transition: .1s;font-weight: 500;
    padding: 8px 15px;font-size:12px;border-radius: 3px;`
    var btnCancel = document.createElement('DIV')
    btnCancel.className = 'msg-dialog-btn'
    btnCancel.innerHTML = '取消'
    btnCancel.style = btnStyle
    var btnOk = document.createElement('DIV')
    btnOk.className = 'msg-dialog-btn'
    btnOk.innerHTML = '确定'
    btnOk.style = `${btnStyle}color: #FFF;background-color: #409EFF;border-color: #409EFF;`
    btns.appendChild(btnCancel)
    btns.appendChild(btnOk)
    content.appendChild(title)
    content.appendChild(btns)
    div.appendChild(content)

    frameDiv.appendChild(div)

    _this._div = div
    _this._title = title
    _this._frameDiv = frameDiv
    _this._btnOk = btnOk
    _this._btnCancel = btnCancel
  },
  setVisible: function(visible) {
    this._div.style.display = visible ? 'block' : 'none'
  },
  showAt: function({
    okClick,
    cancelClick
  }) {
    if (title) {
      this.setVisible(true)
      this._btnOk.onclick = () =>{
        this.setVisible(false)
        if(okClick){
          okClick()
        }
      }
      this._btnCancel.onclick = ()=>{
        this.setVisible(false)
        if(cancelClick){
          cancelClick()
        }
      }
    }
  }
}