<template>
  <div class="app">
    <NavBar @clickPrograme="clickPrograme" @resetFilter="resetFilter" />
    <TheMap ref="MAP" @toggleFilter="toggleFilter" />
    <!-- FINESTRES MODALS -->
    <programs-modal></programs-modal>
    <LRModal></LRModal>
  </div>
</template>

<script>
import NavBar from "components/NavBar.vue";
import TheMap from "components/TheMap.vue";
import "maplibre-gl/dist/maplibre-gl.css";
import { ref } from "vue";
import ProgramsModal from "src/components/modals/ProgramsModal.vue";
import LRModal from "src/components/modals/LRModal.vue";
import { useAppStore } from "../stores/appStore.js";

export default {
  name: "App",
  components: {
    NavBar,
    TheMap,
    ProgramsModal,
    LRModal,
  },
  setup() {
    const appStore = useAppStore();

    const MAP = ref();

    const clickPrograme = (e) => {
      MAP.value.handleFilter(e);
    };

    const resetFilter = (e) => {
      MAP.value.handleResetFilter();
    };

    const toggleFilter = (e) => {
      appStore.toggleFilter();
    };

    return {
      MAP,
      toggleFilter,
      clickPrograme,
      resetFilter,
    };
  },
};
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
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
