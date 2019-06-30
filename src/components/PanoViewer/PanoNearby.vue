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
    name: 'PanoNearby'
};
</script>


