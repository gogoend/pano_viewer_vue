

//与事件相关的各种UI逻辑
/*
  交互方式：
  改变全景照片的方向
  鼠标/触摸：在屏幕上上下滑动改变上下旋转角，左右滑动更改平面旋转角；
  设备朝向：移动设备改变摄像机目标的位置
  改变摄像机的FOV
  鼠标滚轮：向前放大，向后缩小
*/
//处理鼠标或者触摸屏事件
import * as utils from "@/utils/utils";

let util=utils.default;

let bindUIFunc={};

let originUIFunc = {
  pointHandler: function (e) {
    //鼠标拖动全景球事件由鼠标左键来触发
    if (e.type.match("mouse") || e.type == "click") {
      if (e.button != 0) {
        return;
      }
    }

    var evtType = e.type;

    // e.preventDefault();

    if (e.type.match("touch")) {
      e = e.touches[0];
    }

    //事件处理函数中this指向的是addEventListener的元素
    // console.log(this);

    switch (evtType) {
      case "touchstart":
      case "mousedown": {
        this.renderer.domElement.style.cursor = "grab";

        this.userInteract = true;
        //得到鼠标点击位置
        this.pointData.originX = e.clientX;
        this.pointData.originY = e.clientY;

        //
        this.pointData.originTheta = this.targetSphereCood.theta;
        this.pointData.originPhi = this.targetSphereCood.phi;
        //

        this.panoEl.addEventListener(
          "mousemove",
          bindUIFunc.pointHandler,
          false
        );
        this.panoEl.addEventListener(
          "mouseup",
          bindUIFunc.pointHandler,
          false
        );

        this.panoEl.addEventListener(
          "touchmove",
          bindUIFunc.pointHandler,
          false
        );
        this.panoEl.addEventListener(
          "touchend",
          bindUIFunc.pointHandler,
          false
        );

        break;
      }
      case "touchmove":
      case "mousemove": {
        this.renderer.domElement.style.cursor = "grabbing";

        if (this.userInteract) {
          //鼠标移动时计算鼠标的偏移量
          this.pointData.offsetX = e.clientX - this.pointData.originX;
          this.pointData.offsetY = e.clientY - this.pointData.originY;

          //
          this.targetSphereCood.theta =
            this.pointData.offsetX * 0.005 + this.pointData.originTheta;
          // console.log(util.radToDeg(sphereCood.phi))

          var phi = this.pointData.offsetY * 0.005 + this.pointData.originPhi;
          //限制上下俯仰角度，以防万向锁。来自THREEJS
          this.targetSphereCood.phi = util.clamp(
            phi,
            util.degToRad(181),
            util.degToRad(359)
          );

          // console.log(sphereCood.theta + ' ' + sphereCood.phi)

          this.cameraTarget.position.setFromSpherical(this.targetSphereCood);
          this.camera.lookAt(this.cameraTarget.position);
        }
        break;
      }

      case "touchend":
      case "mouseup": {
        this.renderer.domElement.style.cursor = "grab";
        this.userInteract = false;

        this.panoEl.removeEventListener(
          "mouseup",
          bindUIFunc.pointHandler,
          false
        );
        this.panoEl.removeEventListener(
          "touchend",
          bindUIFunc.pointHandler,
          false
        );

        this.panoEl.removeEventListener(
          "mousemove",
          bindUIFunc.pointHandler,
          false
        );
        this.panoEl.removeEventListener(
          "touchmove",
          bindUIFunc.pointHandler,
          false
        );

        break;
      }
    }
  },
  //处理光线投射
  pointRayHandler: function (e) {
    if (e.type.match("mouse") || e.type == "click") {
      //如果按下的按键为鼠标左键则不进行光线投射
      if (e.button == 0) {
        return;
      }
    }
    var mouse = new THREE.Vector2();
    // console.log(event);
    var raycaster = new THREE.Raycaster();
    e.preventDefault();
    //将浏览器坐标转换到Threejs坐标
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);
    console.log(this.camera);

    //一个数组，用于保存与射线相交叉的对象
    //数组下标按照物体远近来进行排序，下标越大越远
    var intersects = raycaster.intersectObjects(scene.children);
    //尝试把射线选中的除了全景球以外的元素删去
    //似乎可以用.filter(function(obj3d){return ...});来替换？
    var realIntersects = [];
    for (var i = 0; i < intersects.length; i++) {
      // console.log(intersects);
      if (
        intersects[i].object.geometry instanceof THREE.SphereBufferGeometry
      ) {
        realIntersects.push(intersects[i]);
      }
    }
    // console.log(realIntersects);
    var intersectPoint = realIntersects[0].point;
    console.log(intersectPoint);
  },
  //处理鼠标滚轮
  mouseScrollHandler: function (e) {
    // console.log(e)
    //主要是更改场景中相机的fov以及相机y坐标
    // console.log(e);
    // console.log(this.camera.fov);
    // console.log(this.cameraGroup.position.y);

    //相机在y轴上位置范围：0~4.5，fov范围：75~120

    // if (this.camera.fov <= 120 && this.camera.position.y<=4.5) {
    this.camera.fov += 0.006 * e.deltaY;
    this.cameraGroup.position.y += 0.001 * e.deltaY;

    this.camera.fov = util.clamp(this.camera.fov, 75, 120);
    this.cameraGroup.position.y = util.clamp(
      this.cameraGroup.position.y,
      0,
      4.5
    );

    this.camera.updateProjectionMatrix();
    // }
  },
  //处理设备方向
  orientationChangeHandler: function (e) {
    //console.log(e);
  },
  deviceOrientationHandler: function (e) {
    this.pauseRotete = true;
    //这个值表示屏幕朝向，当屏幕朝向变的时候改变这个值
    //+-------+   +---------------+   +---------------+
    //|       |   |               |   |               |
    //|       |   |      +90    < |   | >     -90     |
    //|   0   |   |               |   |               |
    //|       |   +---------------+   +---------------+
    //|   ^   |
    //+-------+
    var screenOrientation = window.orientation || 0; //桌面端似乎不存在window.orientation
    //代码来自threejs  //
    var euler = new THREE.Euler();
    if (screenOrientation == 0) {
      euler.set(
        util.degToRad(e.beta),
        util.degToRad(e.alpha),
        util.degToRad(-e.gamma),
        "YXZ"
      ); //从传感器新建一个欧拉角
    }

    if (screenOrientation == 90) {
      euler.set(
        util.degToRad(e.beta),
        util.degToRad(e.alpha),
        util.degToRad(-e.gamma + 45),
        "YXZ"
      ); //从传感器新建一个欧拉角
    }

    var q0 = new THREE.Quaternion();
    var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis
    var qn = new THREE.Quaternion().setFromEuler(euler);
    qn.multiply(q1);
    qn.multiply(
      q0.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -screenOrientation)
    );

    this.camera.setRotationFromQuaternion(qn);
    // this.cameraTarget.quaternion=qn;
    console.log(this.camera.quaternion);
  }
}

// 全景交互
const attachController = function (panoWrapComp, eventOption) {
  for (let key in originUIFunc) {
    bindUIFunc[key] = originUIFunc[key].bind(panoWrapComp)
  }
  //处理一下某些事件的兼容性问题
  //FireFox中鼠标滚轮事件为DOMMouseScroll
  var panoWrapEl = panoWrapComp.panoEl;
  switch (eventOption) {
    //陀螺仪和鼠标之间暂时没想到并存的办法。
    //正常方案：在陀螺仪开启的情况下，可能使用触摸来更改cameraTarget的方向
    case "mouse":
    case "touch": {
      panoWrapComp.pauseRotete = false;
      window.removeEventListener(
        "deviceorientation",
        bindUIFunc.deviceOrientationHandler,
        false
      );
      window.removeEventListener(
        "orientationchange",
        bindUIFunc.orientationChangeHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousedown",
        bindUIFunc.pointHandler,
        false
      );
      panoWrapEl.addEventListener(
        "touchstart",
        bindUIFunc.pointHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousedown",
        bindUIFunc.pointRayHandler,
        false
      );
      panoWrapEl.addEventListener(
        "mousewheel",
        bindUIFunc.mouseScrollHandler,
        false
      );
      break;
    }
    case "orient": {
      panoWrapEl.removeEventListener(
        "mousedown",
        bindUIFunc.pointHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "touchstart",
        bindUIFunc.pointHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "mousedown",
        bindUIFunc.pointRayHandler,
        false
      );
      panoWrapEl.removeEventListener(
        "mousewheel",
        bindUIFunc.mouseScrollHandler,
        false
      );
      window.addEventListener(
        "deviceorientation",
        bindUIFunc.deviceOrientationHandler,
        false
      );
      window.addEventListener(
        "orientationchange",
        bindUIFunc.orientationChangeHandler,
        false
      );
      break;
    }
  }
}
// eslint-disable-next-line import/prefer-default-export
export { attachController }