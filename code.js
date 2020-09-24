let m = []; //Матрица расстояний
let rows = []; //Массив названий городов (по строкам)
let cols = []; //Массив названий городов (по столбцам)
let w = []; //Матрица весов
let dir = {}; //Объект направлений

let map; //Объект карта
let poly; //Объект полигон
let markers = []; //Массив точек

let div = document.getElementById("map");
let bn_calc = document.getElementById("bn_calc");
let bn_clear = document.getElementById("bn_clear");

createMap(); //Создаем объекты карта/полигон/обработчики событий кнопок

//======================================================
// Транспонирование матрицы
//======================================================
const transpose = (matrix) =>
  matrix[0].map((col, i) => matrix.map((row) => row[i]));

//======================================================
// Вычитает минимальный элемент из каждой строки
//======================================================
function normalizeRows() {
  m = m.map((row) => row.map((e) => e - Math.min(...row)));
}

//======================================================
// Вычитает минимальный элемент из каждого столбца
//======================================================
function normalizeCols() {
  m = transpose(m);
  m = m.map((row) => row.map((e) => e - Math.min(...row)));
  m = transpose(m);
}

//======================================================
// Удаляет строку row в матрице
//======================================================
function deleteRow(row) {
  m.splice(row, 1);
  rows.splice(row, 1);
}

//======================================================
// Удаляет столбец col в матрице
//======================================================
function deleteCol(col) {
  m = transpose(m);
  m.splice(col, 1);
  cols.splice(col, 1);
  m = transpose(m);
}

//======================================================
// Находит оценку элемента (сумму минимальных элементов
// строки row и столбца col не включая элемент row,col)
//======================================================
function getWeight(row, col) {
  let minRow = Infinity;
  let minCol = Infinity;

  minRow = Math.min(...m[row].filter((e, i) => i != col));
  m = transpose(m);
  minCol = Math.min(...m[col].filter((e, i) => i != row));
  m = transpose(m);
  return minRow + minCol;
}

//======================================================
// Возвращает массив замкнутых циклов
//======================================================
function findSubCycles() {
  let arrClosePath = [];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      let col = cols[c];
      let to = undefined;
      let from = dir[col];
      if (from != undefined) {
        from = col;
        do {
          to = dir[from];
          if (to != undefined) {
            if (to == rows[r]) arrClosePath.push([rows[r], col]);
            from = to;
          }
        } while (to != undefined);
      }
    }
  }
  return arrClosePath;
}

//======================================================
// Удаляет элементы массива, соответствующие замкнутым циклам
//======================================================
function deleteSubCycles(arr) {
  if (arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      let ir = rows.indexOf(arr[i][0]);
      let ic = cols.indexOf(arr[i][1]);
      if (ir != -1 && ic != -1) m[ir][ic] = Infinity;
    }
  }
}
//======================================================
// Находит путь и заносит его в объект dir
//======================================================
function findPath() {
  let w = [].concat(
    m.map((row, i) => row.map((e, j) => (e == 0 ? getWeight(i, j) : 0)))
  );
  let maxWeight = Math.max(...w.flat());
  //console.log(w);
  //debugger
  let maxElementPos = { row: 0, col: 0, val: -1 };
  for (let j = 0; j < m.length; j++)
    for (let i = 0; i < m.length; i++)
      if (w[i][j] == maxWeight && maxElementPos.val == -1)
        maxElementPos = { row: i, col: j, val: maxWeight };

  let from = rows[maxElementPos.row]; //Пункт отправления
  let to = cols[maxElementPos.col]; //Пункт назначения
  dir[from] = to; //Заносим найденный отрезок пути в объект
  console.log(dir);
  console.log(`from: ${from}  to: ${to}`);

  if (m.length == 1) {
    return false;
  }

  let a = findSubCycles();
  console.log(a);
  deleteSubCycles(a);

  deleteRow(maxElementPos.row); //Удаляем строку с максимальным весом
  deleteCol(maxElementPos.col); //Удаляем столбец с максимальным весом

  console.log(m);
  console.log(`rows: [${rows}]  cols: [${cols}]`);
  return true;
}

//======================================================
//Создание матрицы расстояний по координатам маркетов
//======================================================
function createMatrix() {
  m = Array.from({ length: markers.length }, (_, i) =>
    Array.from({ length: markers.length }, () => Infinity)
  );
  rows = Array.from({ length: markers.length }, (_, i) => i); //Массив названий городов (по строкам)
  cols = Array.from({ length: markers.length }, (_, i) => i); //Массив названий городов (по столбцам)
  dir = {}; //Обнуляем объект путей

  for (let i = 0; i < markers.length; i++)
    for (let j = 0; j < markers.length; j++)
      if (j != i)
        m[i][j] = Math.round(
          getDistance(markers[i].getPosition(), markers[j].getPosition())
        );

  //Wrong worked matrix! =====================
  // m = [
  // 0: (6) [Infinity, 41, 160, 197, 117, 93]
  // 1: (6) [41, Infinity, 149, 177, 78, 72]
  // 2: (6) [160, 149, Infinity, 54, 130, 79]
  // 3: (6) [197, 177, 54, Infinity, 132, 105]
  // 4: (6) [117, 78, 130, 132, Infinity, 64]
  // 5: (6) [93, 72, 79, 105, 64, Infinity]

  // 0-5-2-3-4-1

  // rows = Array.from({ length: 6 }, (_, i) => i + 1); //Массив названий городов (по строкам)
  // cols = Array.from({ length: 6 }, (_, i) => i + 1); //Массив названий городов (по столбцам)
  //==========================================
  //console.log(m);
}

//======================================================
// Основная функция (рассчет оптимального пути)
//======================================================
function calculate() {
  do {
    console.log("---------------------");
    console.log(m);
    console.log(`rows: [${rows}]  cols: [${cols}]`);

    normalizeRows();
    normalizeCols();
    console.log("after normilize:");
    console.log(m);
  } while (findPath());
}

//======================================================
// Функция создания объектов карта/полигон,
// обработчиков событий кнопок
//======================================================
function createMap() {
  const elbrus = { lat: 55.709095, lng: 37.593317 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 17,
    center: elbrus,
  });

  map.addListener("click", addMarker);  //Обработчик клика по карте
  //===============================
  poly = new google.maps.Polyline({
    //path: [],
    geodesic: true,
    strokeColor: "#008000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });
  poly.setMap(map);

  bn_clear.onclick = () => deleteMarkersAndPath();
  bn_calc.onclick = () => {
    createMatrix();
    calculate();
    DrawPath();
  };
}

//======================================================
// Рисует соединения между точками маршрута
//======================================================
function DrawPath() {
  let arr = [0];
  let point = 0;
  const path = [];
  for (let i = 0; i < markers.length; i++) {
    point = dir[point];
    arr.push(point);
  }
  console.log(arr);

  for (let i = 0; i < arr.length; i++) {
    path.push(markers[arr[i]].position);
  }
  poly.setPath(path);
}

//======================================================
// Добавляет маркер на карту
//======================================================
function addMarker(event) {
  //Ограничеваем количество маркеров
  if (markers.length > 50) return;

  const marker = new google.maps.Marker({
    position: event.latLng,
    map: map,
    label: "" + markers.length,
  });
  for (let i = 0; i < markers.length; i++) {
    //Проверяем наложение маркеров по координатам и если таковое имеет место быть - удаляем маркер
    if (
      JSON.stringify(markers[i].position) == JSON.stringify(marker.position)
    ) {
      marker.setMap(null);
      return;
    }
  }
  markers.push(marker);
  if (markers.length > 1) bn_calc.disabled = false; //Если на карте >2 маркеров - можем строить пути
}

//======================================================
// Удаление маркеров
//======================================================
function deleteMarkersAndPath() {
  markers.forEach((e) => e.setMap(null));
  markers = [];
  const path = poly.getPath();
  while (path.length) path.pop();
  bn_calc.disabled = true;
}

//======================================================
// Функция преобразования position lat lng в расстояние (в м)
// Взято тут: https://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
//======================================================
let rad = function (x) {
  return (x * Math.PI) / 180;
};

let getDistance = function (p1, p2) {
  let R = 6378137; // Earth’s mean radius in meter
  let dLat = rad(p2.lat() - p1.lat());
  let dLong = rad(p2.lng() - p1.lng());
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) *
    Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) *
    Math.sin(dLong / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d; // returns the distance in meter
};
