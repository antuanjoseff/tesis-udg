<template>
  <q-toggle
    class="toggle-switch"
    size="80px"
    v-model="value"
    icon="fa-solid fa-map-location-dot"
    @update:model-value="toggleLayer"
    @click.prevent="preventDefault"
  />
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import { computed, ref } from "vue";

export default {
  name: "ToggleLayer",
  emits: ["toggleLayerType"],
  setup(props, context) {
    const appStore = useAppStore();
    const isClustered = computed(() => {
      return appStore.isClustered;
    });
    const value = ref(isClustered.value);

    const toggleLayer = (e) => {
      context.emit("toggleLayerType");
      appStore.setClustered(value.value);
    };

    const preventDefault = (e) => {
      e.preventDefault();
    };

    return {
      value,
      toggleLayer,
      preventDefault,
    };
  },
};
</script>

<style scoped>
.toggle-switch {
  position: absolute;
  right: 20px;
  top: 85px;
  z-index: 200;
}
</style>
