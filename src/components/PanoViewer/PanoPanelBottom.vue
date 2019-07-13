
<template>
  <div class="panoPanelBottom" v-cloak :class="{'fold':$parent.ui.panoPanelBottomFold}">
    <button v-on:click="panoListRollToggle" class="rollOutBtn holaGreen">展开收起</button>
    <div class="panoList" data-role="panoList">
      <ul>
        <li v-for="(pano,index) in panosList">
          <img
            class="panoThumb"
            lazyload="on"
            @click="panoLoad(index)"
            :src="$parent.panoThumbPath+pano.imgThumb"
          />
          <p class="panoTitle">{{pano.desc}}</p>
        </li>
      </ul>
      <!-- 滚动条 -->
    </div>

    <div class="panoControls bottom">
      <button data-role="btn" data-todo="shot" class="holaGreen">截屏</button>
      <button data-role="btn" data-todo="enterVR" class="holaGreen">VR</button>
      <button data-role="btn" data-todo="toggleFullScreen" class="holaGreen">全屏</button>
      <button data-role="btn" data-todo="toggleOrient" class="holaGreen">陀螺仪</button>
      <button data-role="btn" data-todo="togglePointer" class="holaGreen">鼠标</button>
    </div>
  </div>
</template>
<style  lang="less" scoped>
.panoPanelBottom {
  position: absolute;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  bottom: 0;
  transition: 0.4s ease bottom;
  padding-top: 0.1rem;
  &.fold {
    bottom: -1.6rem;
  }
  button.rollOutBtn {
    position: absolute;
    height: 2em;
    top: -2em;
  }
}

.panoList {
  position: relative;
  & > ul {
    display: flex;
    color: #fff;
    margin: 0 auto;
    margin-bottom: 0.5em;
    user-select: none;
    li {
      display: flex;
      flex-direction: column;
      color: #fff;
      justify-content: center;
      margin: 0 10px;
      align-items: center;
      & > img.panoThumb {
        width: 1.5rem;
        display: block;
        min-width: 1.5rem;
        flex-shrink: 0;
      }
      & > p.panoTitle {
        line-height: 1.5em;
        text-align: center;
        flex-shrink: 0;
        display: block;
        word-break: keep-all;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.panoControls {
  .bottom {
    position: absolute;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    top: -0.6rem;
    padding: 0 0.2rem;
    right: 0px;
    button,
    .buttonLike {
      padding: 0.1rem 0.2rem;
      display: block;
      margin: 0 10px;
    }
  }
}
</style>


<script>
import axios from "axios";
import * as THREE from "three";
import store from "@/store"
window.THREE=THREE;

export default {
  name: "PanoPanelBottom",
  data() {
    return {
      //全景图列表中保存的经纬度：若来自用户的相机，在使用时应当首先接入百度地图来进行位置修正，返回百度地图中的坐标
      panosList: null,
      // panosList: panos,
      //存储百度地图地点列表，未来通过访问百度地图API来获得
      neighborList: [], //尝试把neighborList加到panosList的作为子对象

      // neighborList: positions,
      //当前全景图索引，未来试图通过Ajax来获得首次载入时的索引
      currentIndex: 0
    };
  },
  created() {
    //在vue实例创建之前，获得全景列表
    var _this = this;
    axios
      .get("./pano_array.json")
      .then(res => {
        console.log(res);
        _this.panosList = res.data;
        _this.$emit('pano-list-loaded',res.data)
        // store.commit('panosList',res.data)
      })
      .catch(err => {
        console.log(err);
      });
    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", "./pano_array.json");
    // xhr.send();
    // xhr.onreadystatechange = function() {
    //   if (xhr.readyState === 4 && xhr.status === 200) {
    //     _this.panosList = JSON.parse(xhr.responseText);
    //     console.log(_this.panosList);
    //   }
    // };
  },
  mounted() {
    var _this=this;
    //为页面中各个按钮增加事件
    _this.btnTodoHandler();
  },
  methods: {
    //根据对应的panosList索引来载入对应全景照片。
    panoLoad: function(index) {
      var _this = this;

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

            // for (let i = 0; i < _this.poiObjArr.length; i++) {
            //     _this.poiObjArr[i].dispose();
            //     _this.poiObjArr[i].material.dispose();
            //     _this.poiObjArr[i].material.map.needsUpdate = false;
            //     _this.poiObjArr[i].material.map.dispose();
            // }

            //切换之后，读取相关数据，重新将sprite加入场景
            // _this.panoImgTex.needsUpdate = false;

            // _this.loadMap();
          }
        }
      );
    },
    panoListTodo: function() {
      //全景列表处理
      var panoListDOM = document.querySelector('[data-role="panoList"]>ul');
      console.log(panoListDOM.scrollWidth - window.innerWidth);
      // window.a = new SlideBar(
      //   0,
      //   panoListDOM.scrollWidth - window.innerWidth,
      //   document.querySelector('[data-role="panoList"]'),
      //   function(val) {
      //     console.log();
      //     console.log(val);
      //     panoListDOM.style.marginLeft = -val.value + "px";
      //   }
      // );
      // window.addEventListener(
      //   "resize",
      //   function(e) {
      //     a.max = panoListDOM.scrollWidth - window.innerWidth;
      //   },
      //   false
      // );
    },
    //DOM控件交互
    //伸展下方栏
    panoListRollToggle: function() {
      !this.ui.panoPanelBottomFold
        ? (this.ui.panoPanelBottomFold = true)
        : (this.ui.panoPanelBottomFold = false);
    },
    //画面控制按钮
    btnTodoHandler: function() {
      var _this = this;
      var controlerGroups = document.querySelectorAll(".panoControls");
      controlerGroups.forEach(group => {
        group.addEventListener(
          "click",
          function(e) {
            switch (e.target.dataset.todo) {
              case "toggleFullScreen": {
                fullScreen(document.querySelector("body"), false);
                break;
              }
              case "enterVR": {
                _this.enterVR();
                break;
              }
              case "exitVR": {
                _this.exitVR();
                break;
              }
              case "toggleOrient": {
                _this.attachController("orient");
                break;
              }
              case "togglePointer": {
                _this.attachController("mouse");
                break;
              }
              case "shot": {
                _this.shot(
                  document
                    .querySelector(".panoWrap")
                    .getElementsByTagName("canvas")[0]
                );
                break;
              }
            }
          },
          false
        );
      });
    }
  }
};
</script>

        