<template>
  <div>
    <logo />
    <pano-wrap :current-pano="currentPano"/>
    <pano-panel-bottom @pano-list-loaded="handlePanoListLoaded" @current-pano-change="handlePanoChange"/>
  </div>
</template>

<script>
// @ is an alias to /src
import Logo from "@/components/PanoViewer/Logo.vue";
import PanoPanelBottom from "@/components/PanoViewer/PanoPanelBottom.vue";
import PanoWrap from "@/components/PanoViewer/PanoWrap.vue";

export default {
  name: "home",
  components: {
    Logo,
    PanoWrap,
    PanoPanelBottom
  },
  data() {
    return {
      //UI状态
      ui: {
        panoPanelBottomFold: false,
        neighborFold: true,
        VRStatus: false
      },
      //配置全景图文件夹基地址
      panoBasePath: "./pano_images/",
      panoThumbPath: "./pano_thumb/",

      panosList:[],
      currentPano:{}
    };
  },
  created() {},
  methods: {
    // //动画总控
    // animateHandler: function() {
    //   this.panoRotationAnimate();
    //   this.spriteInitRender();
    //   this.renderer.render(this.scene, this.camera);
    //   // console.log(this.renderer)
    //   //注意this指向，在定时器中this指向window
    //   requestAnimationFrame(this.animateHandler.bind(this));
    // },
    //处理全景照片加载
    handlePanoListLoaded:function(res){
      console.log(res)
      this.panosList=res.list;
      this.currentPano=res.list[res.index]
    },
    handlePanoChange:function(index){
      this.currentPano=this.panosList[index]
      console.log(index);
    }
  }
};
</script>
