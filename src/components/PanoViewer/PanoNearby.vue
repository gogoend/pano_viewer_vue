<template>
  <div class="panoNearbyWrap">
    <h2 v-on:click="foldNeighbor()">
      查找附近
      <!-- <input name="findNearby" v-model="neighborSearchKeyword" placeholder="查找附近" />
      <button class="holaGreen" v-on:click="manualSearch()" >→</button>-->
      <button class="holaGreen">×</button>
    </h2>
    <ul class="nearbyList" v-cloak :class="{'fold':ui.neighborFold}">
      <!-- <li class="nearbyItems" v-for="(nearby,index) in poiObjArr"> -->
      <li>
        <a :href="nearby.detailUrl" target="_blank">
          <div class="title">{{nearby.posName}}</div>
          <div class="distance">{{nearby.posDistance}}</div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style lang="less" scoped>
.panoNearbyWrap {
  width: 3rem;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  right: 0.16rem;
  top: 0.16rem;
  height: max-content;
  color: #fff;
  resize: vertical;
  & > h2 {
    line-height: 0.6rem;
    text-align: center;
    font-size: 0.16rem;
    font-weight: 400;
    /* border-bottom: 1px solid rgba(255, 255, 255, 1); */
    display: flex;
    align-items: center;
    padding: 0 0.2rem;
    justify-content: space-between;
    & input {
      border: 0;
      background: rgba(0, 0, 0, 0);
      text-align: inherit;
      font: inherit;
      color: #fff;
      width: 2.4rem;
    }
    & button {
      width: 0.3rem;
      height: 0.3rem;
    }
  }
  & > ul {
    overflow-y: auto;
    overflow-x: hidden;
    height: 4rem;
    font-size: 0.14rem;
    transition: 0.5s ease height;
    &.fold {
      height: 0;
    }
    & > li {
      & > a {
        display: flex;
        justify-content: space-between;
        padding: 0.1rem 0.05rem;
        transition: ease 0.2s background-color;
        cursor: pointer;
        color: #fff;
      }
      .title {
        margin-left: 1em;
      }
      .distance {
        width: 4em;
        text-align: right;
        margin-left: 1em;
        flex-shrink: 0;
      }
    }
    & > li:hover {
      background-color: #62d128;
    }
  }
}

.panoNearbyWrap > ul::-webkit-scrollbar {
  width: 0.08rem;
  border-radius: 0.04rem 0.04rem 0.04rem 0.04rem;
}

.panoNearbyWrap > ul::-webkit-scrollbar-thumb {
  background-color: #62d128;
  border-radius: 0.04rem 0.04rem 0.04rem 0.04rem;
}
</style>

<script>
export default {
  name: "PanoNearby",
  data() {
    return {
      //附近查询关键字
      neighborSearchKeyword: "",
      neighborSearchResult: [],
      //存储百度地图地点列表，未来通过访问百度地图API来获得
      neighborList: [], //尝试把neighborList加到panosList的作为子对象
      //存储Poi对象的数组
      poiObjArr: []
    };
  },
  computed: {
    _neighborSearchResult: {
      set: function(val) {
        console.log(val);
        this.addPoi(val);
      },
      get: function() {
        return this.neighborSearchResult;
      }
    }
  },
  methods: {
    //sprite渲染动画
    spriteInitRender: function() {
      for (var i = 0; i < this.poiObjArr.length; i++) {
        // this.poiObjArr[i].poiObject.material.needsUpdate = true;
        if (this.poiObjArr[i].poiObject.material.map.version < 5) {
          this.poiObjArr[i].poiObject.material.map.needsUpdate = true;
        }
      }
    },
    //计算poi与全景拍摄距离，并将得到的距离赋值给源对象
    poiCalc: function(coodA, coodB) {
      var poiInfo = {
        distance: util.geoLength(coodA, coodB),
        angle: util.geoAngle(coodA, coodB)
      };
      return poiInfo;
    },
    //加载地图函数
    loadMap: function() {
      var times = 0,
        _this = this;
      var a = setInterval(function() {
        if (_this.panosList.length == 0) {
          if (times < 30) {
            console.log("全景列表加载失败");
            times++;
            return;
          }
        } else {
          console.log(_this.panosList);
          clearInterval(a);

          //搜索poi
          if (_this.neighborList[_this.currentIndex] === undefined) {
            _this.neighborList[_this.currentIndex] = [];
          }

          //防止重复加载 //若当前neighborList对应的当前数组中已经有了元素，就直接加入到场景中，不必再去请求
          if (
            _this.neighborList[_this.currentIndex] instanceof Array &&
            _this.neighborList[_this.currentIndex].length > 0
          ) {
            _this.addPoi(_this.neighborList[_this.currentIndex]);
            return;
          } else {
            new BaiduMap(
              _this.panosList[_this.currentIndex].geoCood.lng,
              _this.panosList[_this.currentIndex].geoCood.lat,
              "美食",
              2000,
              _this.neighborList[_this.currentIndex]
            );
          }

          //将Poi板添加到三维场景中
          //异步问题：poi板上会在其中的icon（img）被加载前就被添加到三维场景，此时添加到三维场景中的poi板上不会显示icon；//解决方式：将poiboard材质下map的needsUpdate设为true
          var times = 0;
          a = setInterval(function() {
            console.log(_this.neighborList[_this.currentIndex]);

            if (_this.neighborList[_this.currentIndex].length === 0) {
              if (times < 30) {
                _this.ui.neighborFold = true;
                console.log("正在加载附近数据");
                times++;
                return;
              } else {
                console.log("加载超时");
                _this.ui.neighborFold = true;

                clearInterval(a);
              }
            } else {
              console.log("加载成功");
              _this.ui.neighborFold = false;
              clearInterval(a);
              _this.addPoi(_this.neighborList[_this.currentIndex]);
            }
          }, 200);
        }
      }, 100);
    },

    //将poiBoard加入到场景中
    addPoi: function(bMapArray) {
      console.log(bMapArray);
      console.log(bMapArray.length);
      // if (bMapArray.length!==undefined) {
      //     for (let i = 0; i < bMapArray.length; i++) {
      //         console.log(bMapArray[i])

      //         // bMapArray[i].dispose();
      //         // bMapArray.remove(bMapArray[i]);
      //     }
      // }

      var originP = this.panosList[this.currentIndex].geoCood;
      this.poiObjArr = [];
      for (var i = 0; i < bMapArray.length; i++) {
        bMapArray[i].poiInfo = this.poiCalc(originP, bMapArray[i].point); //算出poi与全景照片拍摄点的距离和角度
        // console.log(bMapArray[i].poiInfo);
        var distanceText;
        if (bMapArray[i].poiInfo.distance > 1000) {
          distanceText =
            (bMapArray[i].poiInfo.distance / 1000).toFixed(1) + " km";
        } else {
          distanceText = bMapArray[i].poiInfo.distance.toFixed(0) + " m";
        }

        //生成sprite
        var poiObj = new PoiBoard(
          bMapArray[i].title,
          distanceText,
          bMapArray[i].detailUrl
        );
        // console.log(poiObj);
        poiObj.poiObject.material.needsUpdate = true;
        poiObj.poiObject.material.map.needsUpdate = true;
        this.poiObjArr.push(poiObj);

        // console.log(this.poiObjArr)

        // //有了角度、有了距离，算球坐标
        // //俯仰角根据poi距离来确定，角度值在90~180之间
        // console.log(bMapArray[i].poiInfo.distance / 2000 * 180);
        // var lengthVal = util.clamp(bMapArray[i].poiInfo.distance / 2000 * this.panoSphereRadius, 0.2 * this.panoSphereRadius, this.panoSphereRadius * 0.3);//poi半径长度，poi越远值越大，但限制在给定范围内
        // var pitchVal = util.degToRad(util.clamp(bMapArray[i].poiInfo.distance / 2000 * 180 + util.rand(-20, 20), 75, 90));//poi球坐标的俯仰角，角度值在90~180之间。
        // var azimuthVal = util.degToRad(bMapArray[i].poiInfo.angle);//poi球坐标的方位角

        // // console.log(lengthVal)
        // var poiSpherical = new THREE.Spherical(lengthVal, pitchVal, azimuthVal);

        // var poiCood = new THREE.Vector3().setFromSpherical(poiSpherical);
        // // console.log(poiCood);
        // poiObj.poiObject.position.x = poiCood.x;
        // poiObj.poiObject.position.y = poiCood.y;
        // poiObj.poiObject.position.z = poiCood.z;

        // this.spriteGroup.add(poiObj.poiObject);
      }
    },
    foldNeighbor: function() {
      this.ui.neighborFold
        ? (this.ui.neighborFold = false)
        : (this.ui.neighborFold = true);
    },
    manualSearch: function() {
      var _this = this;
      _this.neighborSearchResult = [];
      _this._neighborSearchResult = [];
      _this.poiObjArr = [];
      new BaiduMap(
        _this.panosList[_this.currentIndex].geoCood.lng,
        _this.panosList[_this.currentIndex].geoCood.lat,
        _this.neighborSearchKeyword,
        2000,
        _this._neighborSearchResult
      );
    }
  }
};
</script>


