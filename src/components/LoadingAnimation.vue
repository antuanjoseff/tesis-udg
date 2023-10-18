<template>
  <q-dialog v-model="model" class="loading-modal">
    <q-card>
      <q-card-section>
        <q-linear-progress
          v-if="loading"
          indeterminate
          rounded
          size="md"
          track-color="orange"
          color="purple"
          class="q-mt-sm loading-progress"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref } from "vue";
export default {
  name: "LoadingAnimation",
  props: ["loading"],
  setup(props, context) {
    const model = ref(true);
    // setTimeout((model.value = false), 2000);
    return {
      model,
    };
  },
};
</script>

<style scoped>
.loading-modal {
  z-index: 100;
}
</style>
