<template>
  <div class="heading">
    <!-- <ul>
      <li v-for="(p, index) in programes" :key="index" @click="clickPrograme">
        {{ p }}
      </li>
      <li><q-icon name="close" @click="resetFilter" /></li>
    </ul> -->
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import { computed } from "vue";

export default {
  name: "NavBar",
  emits: ["clickPrograme", "resetFilter"],
  setup(props, context) {
    const appStore = useAppStore();

    const programes = computed(() => {
      return appStore.getProgrames;
    });

    const clickPrograme = (e) => {
      context.emit("clickPrograme", e.target.innerHTML);
    };

    const resetFilter = (e) => {
      context.emit("resetFilter");
    };

    return {
      programes,
      clickPrograme,
      resetFilter,
    };
  },
};
</script>

<style scoped>
.heading {
  margin: 0;
  padding: 0px;
  background-color: black;
  color: white;
}

.heading > h3 {
  /* padding: 20px; */
  margin: 0;
}

li {
  display: inline;
  padding-left: 3px;
  padding-right: 3px;
}
</style>
