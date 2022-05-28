const townsCoordinates = [
    { 
        name: "Moscow",
        coordX: 55.76,
        coordY: 37.64
    },
    { 
        name: "Saint-P",
        coordX: 55.76,
        coordY: 37.64
    },
    { 
        name: "Novgorod",
        coordX: 55.76,
        coordY: 37.64
    }
];

//var myMap;

ymaps.ready(init);

function init() {
    myMap = new ymaps.Map("map", {
            center: [55.76, 37.64],
            // Уровень масштабирования. Допустимые значения:
            // от 0 (весь мир) до 19.
            zoom: 9,
            controls: ['zoomControl']
        }, {
            searchControlProvider: 'yandex#search'
        }),
        objects = ymaps.geoQuery([
            {
                type: 'Point',
                coordinates: [55.73, 37.75]
            },
            {
                type: 'Point',
                coordinates: [55.10, 37.45]
            },
            {
                type: 'Point',
                coordinates: [55.25, 37.35]
            }
        ]).addToMap(myMap),
        circle = new ymaps.Circle([[55.43, 37.7], 10000], null, { draggable: true });
        
    circle.events.add('drag', function () {
        // Объекты, попадающие в круг, будут становиться красными.
        var objectsInsideCircle = objects.searchInside(circle);
        objectsInsideCircle.setOptions('preset', 'islands#redIcon');
        // Оставшиеся объекты - синими.
        objects.remove(objectsInsideCircle).setOptions('preset', 'islands#blueIcon');
    });
    myMap.geoObjects.add(circle);
}

function openTownList() {
    document.getElementById("myDropdown").classList.toggle("show");
    myMap.geoObjects.add(new ymaps.Circle([[55.43, 37.7], 10000], null, { draggable: true }));
  }
  
  // Закройте выпадающее меню, если пользователь щелкает за его пределами
  window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }

  alert(JSON.stringify(townsCoordinates));