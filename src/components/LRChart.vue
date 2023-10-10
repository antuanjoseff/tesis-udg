<template>
  <div class="main-container">
    <div class="text-left flex chart-breadcrumb">
      <div>
        <q-icon name="arrow_back" size="xl" class="q-mr-md" @click="close" />
      </div>
      <div>
        <span class="chart-title">{{ selectedProgram }}</span>
      </div>
    </div>
    <div class="chart-container">
      <div id="legend-container"></div>
      <div class="canvas-container">
        <canvas
          id="LRChart"
          :style="{ width: '100%', height: chartHeight }"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart } from "chart.js/auto";
import { ref, onMounted, computed } from "vue";
import { useAppStore } from "../stores/appStore.js";

export default {
  name: "LRChart",
  props: ["data", "program"],
  setup(props, context) {
    const appStore = useAppStore();
    const chartHeight = ref();

    const selectedProgram = computed(() => {
      return appStore.getSelectedProgram;
    });

    const close = () => {
      appStore.setSelectedProgram("");
    };

    const options = {
      plugins: {
        htmlLegend: {
          // ID of the container to put the legend in
          containerID: "legend-container",
        },
        legend: {
          display: false,
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
        let nTesis = 0;
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
          nTesis += p.count;
          return p.count;
        });

        appStore.setNThesisInLR(nTesis);
      }

      const ctx = document.getElementById("LRChart");
      chartHeight.value = "450px";
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
        plugins: [htmlLegendPlugin],
      });
    });

    const getOrCreateLegendList = (chart, id) => {
      const legendContainer = document.getElementById(id);
      let listContainer = legendContainer.querySelector(".leg-wrapper");

      if (!listContainer) {
        listContainer = document.createElement("div");
        listContainer.classList.add("leg-wrapper");
        legendContainer.appendChild(listContainer);
      }

      return listContainer;
    };

    const htmlLegendPlugin = {
      id: "htmlLegend",
      afterUpdate(chart, args, options) {
        const ul = getOrCreateLegendList(chart, options.containerID);

        // Remove old legend items
        while (ul.firstChild) {
          ul.firstChild.remove();
        }

        // Reuse the built-in legendItems generator
        const items = chart.options.plugins.legend.labels.generateLabels(chart);

        items.forEach((item) => {
          const li = document.createElement("div");
          li.classList.add("leg-element");

          li.onclick = () => {
            const { type } = chart.config;
            if (type === "pie" || type === "doughnut") {
              // Pie and doughnut charts only have a single dataset and visibility is per item
              chart.toggleDataVisibility(item.index);
            } else {
              chart.setDatasetVisibility(
                item.datasetIndex,
                !chart.isDatasetVisible(item.datasetIndex)
              );
            }
            chart.update();
          };

          // Color box
          const boxSpan = document.createElement("span");
          boxSpan.style.background = item.fillStyle;
          boxSpan.style.borderColor = item.strokeStyle;
          boxSpan.style.borderWidth = item.lineWidth + "px";
          boxSpan.style.display = "inline-block";
          boxSpan.style.flexShrink = 0;
          boxSpan.style.height = "20px";
          boxSpan.style.marginRight = "10px";
          boxSpan.style.width = "20px";

          // Text
          const textContainer = document.createElement("p");
          textContainer.style.color = item.fontColor;
          textContainer.style.margin = 0;
          textContainer.style.padding = 0;
          textContainer.style.textDecoration = item.hidden
            ? "line-through"
            : "";

          const text = document.createTextNode(item.text);
          textContainer.appendChild(text);

          li.appendChild(boxSpan);
          li.appendChild(textContainer);
          ul.appendChild(li);
        });
      },
    };

    return {
      close,
      chartHeight,
      selectedProgram,
    };
  },
};
</script>

<style>
canvas {
  padding: 0 20px;
}
.main-container {
  border: 1px solid #11172b;
  padding: 20px;
}
.chart-container {
  padding: 20px;
  display: flex;
  flex-direction: row;
}

.canvas-container {
  width: 60%;
}

#legend-container {
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.leg-wrapper {
  display: flex;
  width: 100%;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}

.leg-element {
  display: flex;
  width: 100%;
  padding: 5px 0px;
}

.leg-element p {
  text-align: left;
}

.chart-title {
  padding: 7px 20px;
  border-radius: 25px;
  background-color: #11172b;
  color: white;
  font-size: 25px;
}
.chart-breadcrumb {
  align-items: center;
}
</style>
