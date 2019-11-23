// 全景交互
const attachController = function (panoWrapComp, eventOption) {
  //处理一下某些事件的兼容性问题
  //FireFox中鼠标滚轮事件为DOMMouseScroll
  var panoWrapEl=panoWrapComp.panoWrap;
  switch (eventOption) {
    //陀螺仪和鼠标之间暂时没想到并存的办法。
    //正常方案：在陀螺仪开启的情况下，可能使用触摸来更改cameraTarget的方向
    case "mouse":
    case "touch": {
      panoWrapComp.pauseRotete = false;
      window.removeEventListener(
        "deviceorientation",
        panoWrapComp.eventBind.deviceOrientationHandler,
        false
      );
      window.removeEventListener(
        "orientationchange",
        panoWrapComp.eventBind.orientationChangeHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousedown",
        panoWrapComp.eventBind.pointHandler,
        false
      );
      panoWrapEl.addEventListener(
        "touchstart",
        panoWrapComp.eventBind.pointHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousedown",
        panoWrapComp.eventBind.pointRayHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousewheel",
        panoWrapComp.eventBind.mouseScrollHandler,
        false
      );
      break;
    }
    case "orient": {
      panoWrapEl.removeEventListener(
        "mousedown",
        panoWrapComp.eventBind.pointHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "touchstart",
        panoWrapComp.eventBind.pointHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "mousedown",
        panoWrapComp.eventBind.pointRayHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "mousewheel",
        panoWrapComp.eventBind.mouseScrollHandler,
        false
      );
      window.addEventListener(
        "deviceorientation",
        panoWrapComp.eventBind.deviceOrientationHandler,
        false
      );
      window.addEventListener(
        "orientationchange",
        panoWrapComp.eventBind.orientationChangeHandler,
        false
      );
      break;
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export {attachController}