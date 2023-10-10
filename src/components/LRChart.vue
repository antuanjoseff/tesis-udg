<template>
  <div class="chart-container">
    <canvas
      id="LRChart"
      :style="{ width: '100%', height: chartHeight }"
    ></canvas>
  </div>
  <!-- <div class="text-center chart-container">
    <div>
    </div>
  </div> -->
</template>

<script>
import { Chart } from "chart.js/auto";
import { ref, onMounted } from "vue";
import { useAppStore } from "../stores/appStore.js";

export default {
  name: "LRChart",
  props: ["data", "program"],
  setup(props, context) {
    const appStore = useAppStore();
    const chartHeight = ref();
    const options = {
      plugins: {
        legend: {
          position: "left",
          align: "center",
        },
      },
    };

    const data = ref(props.data ? props.data : "");
    const selected = ref(props.program ? props.program : "");

    onMounted(() => {
      let labels, datasets;

      if (data.value && selected.value) {
        let arr = JSON.parse(JSON.stringify(data.value.programs));
        const programa = arr.filter((e) => {
          return e.name === selected.value;
        });
        programa[0].LR.sort((a, b) => {
          return a.count >= b.count ? 1 : -1;
        });
        labels = programa[0].LR.map((p) => {
          return p.name;
        });

        datasets = programa[0].LR.map((p) => {
          return p.count;
        });
      }

      const ctx = document.getElementById("LRChart");
      chartHeight.value = "400px";
      ctx.height = chartHeight.value;
      ctx.width = "100%";

      myChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: datasets,
            },
          ],
        },
        options: options,
      });
    });

    return {
      chartHeight,
    };
  },
};
</script>
<style scoped>
canvas {
  padding: 0 20px;
}
.chart-container {
  border: 1px solid #11172b;
}
</style>
