<template>
  <div class="app">
    <NavBar @clickPrograme="clickPrograme"/>
    <TheMap ref="MAP"/>
  </div>
</template>

<script>
import NavBar from "components/NavBar.vue";
import TheMap from "components/TheMap.vue";
import "maplibre-gl/dist/maplibre-gl.css";
import { ref } from 'vue'
export default {
  name: "App",
  components: {
    NavBar,
    TheMap,
  },
  setup() {
    const MAP = ref()
    const clickPrograme = (e) => {
      MAP.value.filterData(e)
    }
    return {
      MAP,
      clickPrograme
    }
  }
};
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
    monospace;
}

.app {
  text-align: center;
}
</style>
