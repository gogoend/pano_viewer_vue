<template>
  <div class="panoWrap">
    <div class="panoControls onscreen">
      <button data-role="btn" data-todo="exitVR" class="holaGreen" v-if="$parent.ui.VRStatus">退出VR</button>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import * as utils from "@/utils/utils";

var util = utils.default;
console.log(util);

export default {
  name: "PanoWrap",
  props:{
    currentPano:Object
  },
  data() {
    return {
      //检测是否存在用户交互
      userInteract: false,
      //标识是否暂停旋转动画
      pauseRotete: false,
      //当前的鼠标坐标
      pointData: {
        originX: 0,
        originY: 0,
        offsetX: 0,
        offsetY: 0,
        originTheta: 0,
        originPhi: 0
      }
    };
  },
  created: function() {},
  mounted: function() {
    var _this = this;
    //将事件中的this进行bind
    _this.eventHandlerBind();
    //初始化场景
    _this.sceneInit();
    //加入鼠标事件
    _this.attachController("mouse");

    // _this.panoInit(0)
  },
  methods: {
    //基本场景初始化
    sceneInit: function() {
      // window.a = new SlideBar(50, 100,document.querySelector('[data-role="panoList"]'));

      var scene = new THREE.Scene();
      //用于将scene暴露到全局，仅在调试时使用
      window.scene = scene;
      //默认相机为位于原点的透视相机
      //fov,aspect,near,far
      var defaultCamera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      defaultCamera.name = "defaultCamera";

      var cameraGroup = new THREE.Group();
      cameraGroup.name = "cameraGroup";
      cameraGroup.add(defaultCamera);
      scene.add(cameraGroup);

      var renderer = new THREE.WebGLRenderer({
        antialias: true
      });

      //加光
      var light = new THREE.AmbientLight(0xffffff, 2);
      scene.add(light);

      //尝试将设置设备像素比，防止手机浏览器渲染时产生锯齿。
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      //将渲染器 - Canvas元素插入到DOM中
      var panoWrap = document.getElementById("app").querySelector(".panoWrap");
      panoWrap.appendChild(renderer.domElement);

      //摄像机目标
      var cameraTarget = new THREE.Object3D();
      cameraTarget.name = "cameraTarget";
      //第一个值为半径，第二个值为上下旋转角，第三个值为平面极坐标的旋转角
      var panoSphereRadius = 10;
      var targetSphereCood = new THREE.Spherical(
        panoSphereRadius,
        util.degToRad(225),
        0
      );
      cameraTarget.position.setFromSpherical(targetSphereCood);

      scene.add(cameraTarget);

      //添加窗口缩放事件
      window.addEventListener("resize", this.resizeHandler.bind(this), false);

      this.scene = scene;
      this.camera = defaultCamera;
      this.defaultCamera = defaultCamera;
      this.cameraGroup = cameraGroup;
      this.renderer = renderer;
      this.panoWrap = panoWrap;
      this.light = light;
      this.cameraTarget = cameraTarget;
      this.targetSphereCood = targetSphereCood;
      this.panoSphereRadius = panoSphereRadius;

      console.log(this.targetSphereCood);
    },
    //全景球初始化
    panoInit: function(panoIndex) {
      //全景球半径为10
      var panoGeometry = new THREE.SphereBufferGeometry(
        this.panoSphereRadius,
        36,
        36
      );
      //直接将x设为-1，使得所有面朝向内测
      panoGeometry.scale(-1, 1, 1);

      //载入贴图
      this.panoLoad(panoIndex);

      var panoPhotoMaterial = new THREE.MeshStandardMaterial({
        map: this.panoImgTex,
        color: 0xffffff
      });
      var panoSphere = new THREE.Mesh(panoGeometry, panoPhotoMaterial);
      this.scene.add(panoSphere);

      this.panoGeometry = panoGeometry;
      // this.panoImgTex = panoImgTex;
      this.panoPhotoMaterial = panoPhotoMaterial;
      this.panoSphere = panoSphere;

      console.log(this.camera);

      this.renderer.render(this.scene, this.camera);

      this.animateHandler();

      //阻止默认的鼠标右键菜单弹出
      this.panoWrap.addEventListener(
        "contextmenu",
        function(e) {
          e.preventDefault();
        },
        false
      );
    },
    panoLoad: function(index) {
      var _this = this;
      console.log(this.panoList)
      this.panoImgTex = new THREE.TextureLoader().load(
        this.panoBasePath + this.panosList[index].imgName,
        function(e) {
          _this.panoImgTex.anisotropy = 8;

          e.image.src = _this.panoBasePath + _this.panosList[index].imgName;
          if (index == _this.currentIndex) {
            return;
          } else {
            _this.currentIndex = index;
            _this.panoImgTex.dispose();

            _this.panoPhotoMaterial.map = e;

            // _this.panoImgTex.needsUpdate = true;

            for (let i = 0; i < _this.spriteGroup.length; i++) {
              _this.spriteGroup[i].dispose(); //在切换之前把当前全景上所有的sprite poi清空
            }
            _this.spriteGroup.children = []; //在切换之前把当前全景上所有的sprite poi清空
          }
        }
      );
    },
    //与事件相关的各种UI逻辑
    eventHandlerBind: function() {
      this.eventBind = {};
      //事件处理函数中this指向的是addEventListener的元素，因此需要bind
      //但使用bind会生成一个新的函数，没法removeEventListener，在此先将函数预先bind
      this.eventBind.deviceOrientationHandler = this.deviceOrientationHandler.bind(
        this
      );
      this.eventBind.orientationChangeHandler = this.orientationChangeHandler.bind(
        this
      );
      this.eventBind.pointHandler = this.pointHandler.bind(this);
      this.eventBind.pointRayHandler = this.pointRayHandler.bind(this);
      this.eventBind.mouseScrollHandler = this.mouseScrollHandler.bind(this);
    },
    //全景交互
    attachController: function(eventOption) {
      //处理一下某些事件的兼容性问题
      //FireFox中鼠标滚轮事件为DOMMouseScroll

      switch (eventOption) {
        //陀螺仪和鼠标之间暂时没想到并存的办法。
        //正常方案：在陀螺仪开启的情况下，可能使用触摸来更改cameraTarget的方向
        case "mouse":
        case "touch": {
          this.pauseRotete = false;
          window.removeEventListener(
            "deviceorientation",
            this.eventBind.deviceOrientationHandler,
            false
          );
          window.removeEventListener(
            "orientationchange",
            this.eventBind.orientationChangeHandler,
            false
          );
          this.panoWrap.addEventListener(
            "mousedown",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.addEventListener(
            "touchstart",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.addEventListener(
            "mousedown",
            this.eventBind.pointRayHandler,
            false
          );
          this.panoWrap.addEventListener(
            "mousewheel",
            this.eventBind.mouseScrollHandler,
            false
          );
          break;
        }
        case "orient": {
          this.panoWrap.removeEventListener(
            "mousedown",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.removeEventListener(
            "touchstart",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.removeEventListener(
            "mousedown",
            this.eventBind.pointRayHandler,
            false
          );
          this.panoWrap.removeEventListener(
            "mousewheel",
            this.eventBind.mouseScrollHandler,
            false
          );
          window.addEventListener(
            "deviceorientation",
            this.eventBind.deviceOrientationHandler,
            false
          );
          window.addEventListener(
            "orientationchange",
            this.eventBind.orientationChangeHandler,
            false
          );
          break;
        }
      }
    },
    //动画处理
    //全景球旋转动画    //setInterval(animate,100);
    panoRotationAnimate: function() {
      //交互部分
      //判断是否存在用户交互
      //无交互、且无暂停
      if (!this.userInteract) {
        if (!this.pauseRotete) {
          this.targetSphereCood.theta += util.degToRad(0.075);
          this.cameraTarget.position.setFromSpherical(this.targetSphereCood);
          //判断当前相机是否为相机阵列，如果是的话在请求动画时需要遍历更新子相机
          if (this.camera instanceof THREE.ArrayCamera === false) {
            this.camera.lookAt(this.cameraTarget.position);
            //console.log(this.cameraTarget.position);
          } else {
            for (var i = 0; i < this.camera.cameras.length; i++) {
              this.camera.cameras[i].lookAt(this.cameraTarget.position);
            }
          }
        }
      }
    },
    /*
      交互方式：
      改变全景照片的方向
      鼠标/触摸：在屏幕上上下滑动改变上下旋转角，左右滑动更改平面旋转角；
      设备朝向：移动设备改变摄像机目标的位置
      改变摄像机的FOV
      鼠标滚轮：向前放大，向后缩小
    */
    //处理鼠标或者触摸屏事件
    pointHandler: function(e) {
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

          this.panoWrap.addEventListener(
            "mousemove",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.addEventListener(
            "mouseup",
            this.eventBind.pointHandler,
            false
          );

          this.panoWrap.addEventListener(
            "touchmove",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.addEventListener(
            "touchend",
            this.eventBind.pointHandler,
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

          this.panoWrap.removeEventListener(
            "mouseup",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.removeEventListener(
            "touchend",
            this.eventBind.pointHandler,
            false
          );

          this.panoWrap.removeEventListener(
            "mousemove",
            this.eventBind.pointHandler,
            false
          );
          this.panoWrap.removeEventListener(
            "touchmove",
            this.eventBind.pointHandler,
            false
          );

          break;
        }
      }
    },
    //处理窗口大小改变时三维场景的变化
    resizeHandler: function(e) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    },

    //处理光线投射
    pointRayHandler: function(e) {
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
    mouseScrollHandler: function(e) {
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
    orientationChangeHandler: function(e) {
      //console.log(e);
    },
    deviceOrientationHandler: function(e) {
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
    },

    //场景中Sprite组初始化
    spriteGroupInit: function() {
      var spriteOutterGroup = new THREE.Group();
      spriteOutterGroup.name = "spriteOutterGroup";
      var spriteGroup = new THREE.Group();
      spriteGroup.name = "spriteGroup";
      spriteGroup.scale.x = -1;
      spriteGroup.scale.y = -1;
      spriteGroup.rotation.y = util.degToRad(-90);
      spriteOutterGroup.add(spriteGroup);
      scene.add(spriteOutterGroup);

      this.spriteGroup = spriteGroup;
    },

    //切换到VR
    enterVR: function() {
      this.ui.VRStatus = true;

      var element = document.querySelector(".panoWrap");
      if (document.fullscreenElement) {
        fullScreen("exit");
        fullScreen(element, true);
      } else {
        fullScreen(element, true);
      }
      // element.addEventListener('fullscreenchange', function (e) {
      //     console.log(e);
      //     fullScreen('exit');
      // });
      this.attachController("orient");

      if (!this.hmdGlasses) {
        //设置左眼右眼
        var rightCamera = new THREE.PerspectiveCamera(
          90,
          window.innerWidth / window.innerHeight / 2,
          0.1,
          1000
        );
        rightCamera.name = "rightCamera";
        var leftCamera = new THREE.PerspectiveCamera(
          90,
          window.innerWidth / window.innerHeight / 2,
          0.1,
          1000
        );
        leftCamera.name = "leftCamera";

        //设置相机的边界
        leftCamera.bounds = new THREE.Vector4(0, 0, 0.5, 1);
        rightCamera.bounds = new THREE.Vector4(0.5, 0, 0.5, 1);

        //瞳距
        leftCamera.position.x = -0.2;
        rightCamera.position.x = 0.2;

        // leftCamera.lookAt(this.cameraTarget);
        // rightCamera.lookAt(this.cameraTarget);

        var hmdGlasses = new THREE.ArrayCamera([leftCamera, rightCamera]);

        hmdGlasses.name = "hmdGlasses";

        // hmdGlasses.lookAt(this.cameraTarget);

        hmdGlasses.add(leftCamera);
        hmdGlasses.add(rightCamera);
        this.cameraGroup.add(hmdGlasses);

        this.hmdGlasses = hmdGlasses;
      }

      this.camera = this.hmdGlasses;
    },

    //退出VR
    exitVR: function() {
      var _this = this;
      fullScreen("exit", false, function() {
        if (document.fullscreenElement === null) {
          _this.ui.VRStatus = false;
          _this.attachController("mouse");
          _this.camera = _this.defaultCamera;
        }
      });
    },

    //全景截图，相当于Canvas截取图片
    shot: function(canvas) {
      //如果没有传入canvas元素或者传入的不是canvas元素，就默认将canvas参数设为获得的第一个canvas元素
      if (!(canvas instanceof HTMLCanvasElement)) {
        if (document.getElementsByTagName("canvas").length !== 0) {
          canvas = document.getElementsByTagName("canvas")[0];
        } else {
          return;
        }
      }

      //现渲染现截图，若不渲染就截图，会导致截到全黑画面
      this.renderer.render(this.scene, this.camera);
      // console.log(this.renderer.domElement.toDataURL('image/jpeg', 0.92));
      // window.open();

      var date = new Date();
      var filenameTime =
        "panoshot_" +
        date.getFullYear() +
        (date.getMonth() + 1) +
        date.getDate() +
        date.getHours() +
        date.getMinutes() +
        date.getSeconds();
      var imglink = document.createElement("a");
      imglink.download = filenameTime;
      imglink.setAttribute(
        "href",
        this.renderer.domElement.toDataURL("image/jpeg", 0.7)
      );
      console.log(imglink);
      var event = new MouseEvent("click");
      imglink.dispatchEvent(event);
      // imglink.click()

      // canvas.toBlob(
      //     function (blob) {
      //         console.log(blob)
      //     },
      //     'image/jpeg',
      //     0.92
      // );
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.panoWrap {
  position: absolute;
  overflow: hidden;
  & > canvas {
    cursor: -webkit-grab;
    cursor: grab;
  }
}
.panoControls {
  position: absolute;
  width: 100%;
  &.onscreen {
    padding: 0.1rem 0.2rem;
    display: block;
    margin: 0 auto;
  }
}
</style>