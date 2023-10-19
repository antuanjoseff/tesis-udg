<template>
  <div class="chart-container">
    <canvas
      id="myChart"
      class="bar-chart"
      :style="{ height: chartHeight }"
    ></canvas>
  </div>
</template>

<script>
import { Chart } from "chart.js/auto";
import { ref, onMounted, computed } from "vue";
import { useAppStore } from "src/stores/appStore.js";

export default {
  name: "ProgramsChart",
  props: ["data", "num"],
  emits: ["selectedProgram"],
  setup(props, context) {
    let myChart;
    const appStore = useAppStore();
    const chartHeight = ref();

    const options = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          padding: {
            left: 20,
            right: 20,
            top: 7,
            bottom: 7,
          },
          xAlign: "left",
          displayColors: false,
          callbacks: {
            title: function (context) {
              return "";
            },
          },
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
              size: 15, //this change the font size
            },
          },
        },
      },
    };

    const data = ref(props.data ? props.data : "");
    // const programes = computed(() => {
    //   return appStore.getProgrames;
    // });

    onMounted(() => {
      const barThickness = 30;
      const chartYMargin = 40;
      let labels, datasets;
      // let missing = [];
      if (data.value) {
        // let arr = JSON.parse(props.data);
        let arr = JSON.parse(JSON.stringify(data.value.programs));

        // programes.value.forEach((p) => {
        //   const found = arr.find((a) => {
        //     return p === a.name;
        //   });
        //   if (!found) {
        //     missing.push([p, 0]);
        //   }
        // });

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

        chartHeight.value = labels.length * barThickness + chartYMargin + "px";
      }

      const ctx = document.getElementById("myChart");
      ctx.height = chartHeight.value;
      ctx.width = "800";

      myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              data: datasets,
              borderWidth: 1,
              barThickness: barThickness,
              backgroundColor: "#FD9E4B",
              hoverBackgroundColor: "#F2CEAF",
            },
          ],
        },
        options: options,
      });

      ctx.onclick = clickHandler;
    });

    const clickHandler = (click) => {
      const points = myChart.getElementsAtEventForMode(
        click,
        "nearest",
        { intersect: true },
        true
      );
      if (points.length) {
        let firstPoint = points[0];
        const program = myChart.data.labels[firstPoint.index];
        appStore.setProgramClickedOnChart(program);
        appStore.setLRModalVisibility(true);
        context.emit("selectedProgram", program);
      }
    };
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
  display: flex;
  justify-content: space-around;
}
canvas.bar-chart {
  display: flex;
}
</style>
