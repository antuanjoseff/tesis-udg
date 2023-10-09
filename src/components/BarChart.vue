<template>
  <div class="chart-container">
    <canvas id="myChart"></canvas>
  </div>
  <!-- <div class="text-center chart-container">
    <div>
    </div>
  </div> -->
</template>

<script>
import { Chart } from "chart.js/auto";
import { ref, onMounted, computed } from "vue";
import { useAppStore } from "../stores/appStore.js";

export default {
  name: "BarChart",
  props: ["data", "num"],
  setup(props) {
    const appStore = useAppStore();
    const chartHeight = ref();
    const options = {
      plugins: {
        legend: {
          display: false,
        },
      },
      indexAxis: "y",
      scales: {
        x: {
          max: props.num + 2,
          ticks: {
            precision: 0,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10, //this change the font size
            },
          },
        },
      },
    };

    const programes = computed(() => {
      return appStore.getProgrames;
    });

    onMounted(() => {
      let labels, datasets;
      let missing = [];
      if (props.data) {
        // let arr = JSON.parse(props.data);
        let arr = JSON.parse(JSON.stringify(props.data.programs));

        programes.value.forEach((p) => {
          const found = arr.find((a) => {
            return p === a.name;
          });
          if (!found) {
            missing.push([p, 0]);
          }
        });

        // if (missing.length) {
        //   arr.concat(missing)
        // }
        // arr = [...arr, ...missing]
        arr.sort((a, b) => (a.count < b.count ? 1 : -1));
        labels = arr.map((programa) => {
          return programa.name;
        });

        datasets = arr.map((programa) => {
          return programa.count;
        });

        chartHeight.value = labels.length * 12;
      }

      const ctx = document.getElementById("myChart");
      ctx.height = chartHeight.value;

      const myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              data: datasets,
              borderWidth: 1,
              barThickness: 30,
              backgroundColor: "#FD9E4B",
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
