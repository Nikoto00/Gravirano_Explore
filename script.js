document.addEventListener("DOMContentLoaded", function () {
  const colorPicker = document.getElementById("colorPicker");
  const resetBtn = document.getElementById("resetBtn");
  const saveBtn = document.getElementById("saveBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const themeBtn = document.getElementById("toggleTheme");
  const shuffleBtn = document.getElementById("shuffleGroups");
  const svgElement = document.getElementById("worldMap");
  const defaultColor = "#ccc";
  const selectedColors = {};
  const paths = svgElement.querySelectorAll("path");

  const colorGroups = {
    group1: [], group2: [], group3: [], group4: [], group5: []
  };

  const groupColors = {
    group1: "#ffcc00",
    group2: "#66ccff",
    group3: "#cccccc",
    group4: "#99cc66",
    group5: "#ff9999"
  };

  const groupLookup = new Map();

  function assignRandomGroups() {
    Object.keys(colorGroups).forEach(group => colorGroups[group] = []);
    groupLookup.clear();

    const ids = Array.from(paths).map(p => p.id).filter(Boolean);
    ids.forEach(id => {
      const rand = Math.floor(Math.random() * 5) + 1;
      const group = `group${rand}`;
      colorGroups[group].push(id);
      groupLookup.set(id, group);
    });

    Object.keys(colorGroups).forEach(group => {
      const color = groupColors[group];
      colorGroups[group].forEach(id => {
        const path = document.getElementById(id);
        if (path) {
          path.style.fill = color;
          selectedColors[id] = color;
        }
      });
    });
  }

  // Зареждане на запазени цветове
  const saved = JSON.parse(localStorage.getItem("mapColors") || "{}");
  paths.forEach(path => {
    const id = path.id;
    const savedColor = saved[id] || defaultColor;
    path.style.fill = savedColor;
    selectedColors[id] = savedColor;
  });

  // Hover ефект
  svgElement.addEventListener("mouseover", (e) => {
    const path = e.target.closest("path");
    if (path && selectedColors[path.id]) {
      path.style.fill = colorPicker.value;
    }
  });

  svgElement.addEventListener("mouseout", (e) => {
    const path = e.target.closest("path");
    if (path && selectedColors[path.id]) {
      path.style.fill = selectedColors[path.id];
    }
  });

  // Плавно оцветяване
  function smoothColoring(ids, color) {
    let index = 0;
    function step() {
      const chunk = ids.slice(index, index + 10);
      chunk.forEach(id => {
        const path = document.getElementById(id);
        if (path) {
          path.style.fill = color;
          selectedColors[id] = color;
        }
      });
      index += 10;
      if (index < ids.length) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Клик върху държава
  svgElement.addEventListener("click", (e) => {
    const path = e.target.closest("path");
    if (!path || !path.id) return;
    const clickedId = path.id;
    const color = colorPicker.value;
    const groupName = groupLookup.get(clickedId);

    if (groupName) {
      smoothColoring(colorGroups[groupName], color);
    } else {
      path.style.fill = color;
      selectedColors[clickedId] = color;
    }
  });

  // Нулиране
  resetBtn.addEventListener("click", () => {
    paths.forEach(path => {
      path.style.fill = defaultColor;
      selectedColors[path.id] = defaultColor;
    });
    localStorage.removeItem("mapColors");
  });

  // Запазване
  saveBtn.addEventListener("click", () => {
    localStorage.setItem("mapColors", JSON.stringify(selectedColors));
    alert("Конфигурацията е запазена.");
  });

  // Изтегляне
  downloadBtn.addEventListener("click", () => {
    html2canvas(document.querySelector("#svg-container")).then(canvas => {
      const link = document.createElement('a');
      link.download = 'map.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  });

  // Теми
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    localStorage.setItem("theme", theme);
    themeBtn.innerHTML = `<span class="icon">${theme === "dark" ? "☀️" : "🌙"}</span> Смени тема`;

    const lightLogo = document.querySelector(".logo.light-only");
    const darkLogo = document.querySelector(".logo.dark-only");

    if (theme === "dark") {
      if (lightLogo) lightLogo.style.display = "none";
      if (darkLogo) darkLogo.style.display = "block";
    } else {
      if (lightLogo) lightLogo.style.display = "block";
      if (darkLogo) darkLogo.style.display = "none";
    }
  }

  themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");
    const newTheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    themeBtn.innerHTML = `<span class="icon">${isDark ? "☀️" : "🌙"}</span> Смени тема`;

    const lightLogo = document.querySelector(".logo.light-only");
    const darkLogo = document.querySelector(".logo.dark-only");

    if (isDark) {
      if (lightLogo) lightLogo.style.display = "none";
      if (darkLogo) darkLogo.style.display = "block";
    } else {
      if (lightLogo) lightLogo.style.display = "block";
      if (darkLogo) darkLogo.style.display = "none";
    }
  });

  applyTheme(localStorage.getItem("theme") || "light");

  // Разбъркване
  shuffleBtn.addEventListener("click", () => {
    assignRandomGroups();
    setupLegendColorInputs();
    alert("Групите са разпределени на случаен принцип.");
  });

  // Смяна на цвят от инпутите
  function setupLegendColorInputs() {
    document.querySelectorAll('#legend input[type="color"]').forEach(input => {
      input.removeEventListener("input", input._handler || (() => {}));
      const handler = () => {
        const group = input.dataset.group;
        const newColor = input.value;
        groupColors[group] = newColor;

        colorGroups[group].forEach(id => {
          const path = document.getElementById(id);
          if (path) {
            path.style.fill = newColor;
            selectedColors[id] = newColor;
          }
        });
      };
      input._handler = handler;
      input.addEventListener("input", handler);
    });
  }

  assignRandomGroups();
  setupLegendColorInputs();

  // svg-pan-zoom
  svgPanZoom('#worldMap', {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true
  });

  // Влачене на легендата
  function makeDraggable(el) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    el.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;

      el.style.position = "fixed";
      el.style.zIndex = 9999;
      el.style.bottom = "auto";
      el.style.right = "auto";
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  const legend = document.getElementById("legend");
  const toggleBtn = document.getElementById("toggleLegend");

  if (legend) makeDraggable(legend);

  if (legend && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      legend.classList.toggle("hidden");
      toggleBtn.textContent = legend.classList.contains("hidden") ? "👁" : "✖";
    });
  }
});
