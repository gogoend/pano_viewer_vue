<template>
  <div ref="panoWrap" class="panoWrap">
    <div class="panoControls onscreen">
      <button data-role="btn" data-todo="exitVR" class="holaGreen" v-if="$parent.ui.VRStatus">退出VR</button>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import * as utils from "@/utils/utils";
import UUID from "uuid-js";
import { attachController } from "@/api/controllerToDo.js";

var util = utils.default;
console.log(util);

export default {
  name: "PanoWrap",
  props: {
    currentPano: Object
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
      },
      panoWrapID:null,
      //配置全景图文件夹基地址
      panoBasePath: "./pano_images/",
      panoThumbPath: "./pano_thumb/"
    };
  },
  created: function() {
    this.panoWrapID = UUID.create().toString();
  },
  mounted: function() {
    var _this = this;
    _this.$store.panoWrapComp = _this;

    //初始化场景
    _this.sceneInit();
    //加入鼠标事件
    attachController(_this, "mouse");

    _this.panoInit();
  },
  watch: {
    currentPano(val) {
      console.log(val);
      this.panoLoad();
      // return val;
    }
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
      var panoEl = document.getElementById("app").querySelector(".panoWrap");
      panoEl.appendChild(renderer.domElement);

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
      this.panoEl = panoEl;
      this.light = light;
      this.cameraTarget = cameraTarget;
      this.targetSphereCood = targetSphereCood;
      this.panoSphereRadius = panoSphereRadius;

      console.log(this.targetSphereCood);
    },
    //全景球初始化
    panoInit: function() {
      //全景球半径为10
      var panoGeometry = new THREE.SphereBufferGeometry(
        this.panoSphereRadius,
        36,
        36
      );
      //直接将x设为-1，使得所有面朝向内测
      panoGeometry.scale(-1, 1, 1);

      var panoPhotoMaterial = new THREE.MeshStandardMaterial({
        // map: this.panoImgTex,
        color: 0xffffff
        // wireframe:true
      });
      var panoSphere = new THREE.Mesh(panoGeometry, panoPhotoMaterial);
      this.scene.add(panoSphere);

      this.panoGeometry = panoGeometry;
      // this.panoImgTex = panoImgTex;
      this.panoPhotoMaterial = panoPhotoMaterial;
      this.panoSphere = panoSphere;

      console.log(this.camera);

      this.renderer.render(this.scene, this.camera);

      this.panoRotationAnimate();
      // this.animateHandler();

      //阻止默认的鼠标右键菜单弹出
      this.panoEl.addEventListener(
        "contextmenu",
        function(e) {
          e.preventDefault();
        },
        false
      );
    },
    panoLoad: function() {
      var _this = this;
      // console.log(this.panoList)
      this.panoImgTex = new THREE.TextureLoader().load(
        this.panoBasePath + this.currentPano.imgName,
        function(e) {
          _this.panoImgTex.anisotropy = 8;

          e.image.src = _this.panoBasePath + _this.currentPano.imgName;
          // if (index == _this.currentIndex) {
          //   return;
          // }
          //  else {
          // _this.currentIndex = index;
          _this.panoImgTex.dispose();
          _this.panoPhotoMaterial.map = e;
          _this.panoPhotoMaterial.needsUpdate = true;

          console.log(e);
          // _this.panoImgTex.needsUpdate = true;

          // for (let i = 0; i < _this.spriteGroup.length; i++) {
          //   _this.spriteGroup[i].dispose(); //在切换之前把当前全景上所有的sprite poi清空
          // }
          // _this.spriteGroup.children = []; //在切换之前把当前全景上所有的sprite poi清空
          // }
        }
      );
      // console.log(this.panoImgTex)
    },
    //处理窗口大小改变时三维场景的变化
    resizeHandler: function(e) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
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
      this.renderer.render(this.scene, this.camera);
      // console.log(this.renderer)
      //注意this指向，在定时器中this指向window
      requestAnimationFrame(this.panoRotationAnimate.bind(this));
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