<template>
  <div class="panoWrap">
    <div class="panoControls onscreen">
      <button data-role="btn" data-todo="exitVR" class="holaGreen" v-if="ui.VRStatus">退出VR</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "PanoWrap"
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