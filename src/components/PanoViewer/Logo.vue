<template>
  <div class="logo">
    <!-- test -->
    <img src="/static/logo.svg" />
  </div>
</template>

<script>
export default {
  name: "Logo"
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.logo {
  position: absolute;
  margin: 0.2rem 0 0 0.4rem;
  z-index: 999;
}
.logo > img {
  width: 2rem;
}
</style>
