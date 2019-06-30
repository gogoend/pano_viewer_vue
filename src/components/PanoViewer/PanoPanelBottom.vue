
<template>
  <div class="panoPanelBottom" v-cloak :class="{'fold':ui.panoPanelBottomFold}">
    <button v-on:click="panoListRollToggle" class="rollOutBtn holaGreen">展开收起</button>
    <div class="panoList" data-role="panoList">
      <ul>
        <li>
          <!-- <li v-for="(pano,index) in panosList"> -->
          <img
            class="panoThumb"
            lazyload="on"
            @click="panoLoad(index)"
            :src="panoThumbPath+pano.imgThumb"
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
export default {
  name: "PanoPanelBottom"
};
</script>

        