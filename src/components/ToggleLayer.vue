<template>
  <q-toggle v-model="value" icon="alarm" @update:model-value="toggleLayer" />
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
    return {
      value,
      toggleLayer,
    };
  },
};
</script>

<style scoped></style>
