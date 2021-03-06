var isDoubleClicked = false;
var circleRadius = 10000;
var atmTYPE = "category1";

function h3polygon(polygon) {
    const hexagons = h3.polyfill(polygon, 10);
    return hexagons;
}

function postHexagons() {
    addHexagons();
    // var xhr = new XMLHttpRequest();
    // xhr.open("POST", "http://localhost:8080/predict");
    //
    // xhr.setRequestHeader("Accept", "application/json");
    // xhr.setRequestHeader("Content-Type", "application/json");
    //
    // xhr.onload = () => console.log(xhr.responseText);
    
    var dataToML = {
        "h3_list": hexagonsId,
        "atm_category": atmTYPE
    };

    //xhr.send(JSON.stringify(dataToML));

    $.ajax("http://localhost:8080/predict", {
        beforeSend: function (request) {
            request.setRequestHeader("Accept", '*/*');
            request.setRequestHeader("Access-Control-Allow-Origin", "*");
            request.setRequestHeader("Content-Type", "application/json");
        },
        type: 'POST',
        crossDomain: true,
        data: JSON.stringify(dataToML)
    }).done(function (data) {
        drawHexagons(JSON.parse(data).hexagons);
    });

    //var response = xhr.response;
    
    //drawHexagons(response.hexagons);

}

var myMap;
var rectMap = [];
var hexagonsId = [];
ymaps.ready(init);

function init() {


    myMap = new ymaps.Map("map", {
            center: [55.76, 37.64],
            // Уровень масштабирования. Допустимые значения:
            // от 0 (весь мир) до 19.
            zoom: 15,
            controls: ['zoomControl']
        });
    var ListBoxLayout = ymaps.templateLayoutFactory.createClass(
            "<button id='my-listbox-header' class='btn btn-success dropdown-toggle' data-toggle='dropdown' style='display: none'>" +
                "{{data.title}} <span class='caret'></span>" +
            "</button>" +
            // Этот элемент будет служить контейнером для элементов списка.
            // В зависимости от того, свернут или развернут список, этот контейнер будет
            // скрываться или показываться вместе с дочерними элементами.
            "<ul id='my-listbox'" +
                " class='dropdown-menu' role='menu' aria-labelledby='dropdownMenu'" +
                " style='display: {% if state.expanded %}block{% else %}none{% endif %};'></ul>", {

            build: function() {
                // Вызываем метод build родительского класса перед выполнением
                // дополнительных действий.
                ListBoxLayout.superclass.build.call(this);

                this.childContainerElement = $('#my-listbox').get(0);
                // Генерируем специальное событие, оповещающее элемент управления
                // о смене контейнера дочерних элементов.
                this.events.fire('childcontainerchange', {
                    newChildContainerElement: this.childContainerElement,
                    oldChildContainerElement: null
                });
            },

            // Переопределяем интерфейсный метод, возвращающий ссылку на
            // контейнер дочерних элементов.
            getChildContainerElement: function () {
                return this.childContainerElement;
            },

            clear: function () {
                // Заставим элемент управления перед очисткой макета
                // откреплять дочерние элементы от родительского.
                // Это защитит нас от неожиданных ошибок,
                // связанных с уничтожением dom-элементов в ранних версиях ie.
                this.events.fire('childcontainerchange', {
                    newChildContainerElement: null,
                    oldChildContainerElement: this.childContainerElement
                });
                this.childContainerElement = null;
                // Вызываем метод clear родительского класса после выполнения
                // дополнительных действий.
                ListBoxLayout.superclass.clear.call(this);
            }
        }),

        // Также создадим макет для отдельного элемента списка.
        ListBoxItemLayout = ymaps.templateLayoutFactory.createClass(
            "<li><a>{{data.content}}</a></li>"
        ),

        // Создадим 2 пункта выпадающего списка
        listBoxItems = [
            new ymaps.control.ListBoxItem({
                data: {
                    content: 'Москва',
                    center: [55.751574, 37.573856],
                    zoom: 15
                }
            }),
            new ymaps.control.ListBoxItem({
                data: {
                    content: 'Санкт-Петербург',
                    center: [59.94, 30.32],
                    zoom: 15
                }
            }),
            new ymaps.control.ListBoxItem({
                data: {
                    content: 'Новосибирск',
                    center: [55.00835, 82.93573],
                    zoom: 15
                }
            }),
            new ymaps.control.ListBoxItem({
                data: {
                    content: 'Екатеринбург',
                    center: [56.8519, 60.6122],
                    zoom: 15
                }
            }),
        ],

        // Теперь создадим список, содержащий 2 пункта.
        listBox = new ymaps.control.ListBox({
                items: listBoxItems,
                data: {
                    title: 'Выберите город'
                },
                options: {
                    // С помощью опций можно задать как макет непосредственно для списка,
                    layout: ListBoxLayout,
                    // так и макет для дочерних элементов списка. Для задания опций дочерних
                    // элементов через родительский элемент необходимо добавлять префикс
                    // 'item' к названиям опций.
                    itemLayout: ListBoxItemLayout
                }
            });

        listBox.events.add('click', function (e) {
            // Получаем ссылку на объект, по которому кликнули.
            // События элементов списка пропагируются
            // и их можно слушать на родительском элементе.
            var item = e.get('target');
            // Клик на заголовке выпадающего списка обрабатывать не надо.
            if (item != listBox) {
                myMap.setCenter(
                    item.data.get('center'),
                    item.data.get('zoom')
                );
            }
        });

    myMap.behaviors.disable('dblClickZoom');

    myMap.events.add('dblclick', function (e) {
        var coords = e.get('coords');

        var leftB = coords[1] - 0.000001 * circleRadius;
        var rightB = coords[1] + 0.000001 * circleRadius;
        var topB = coords[0] + 0.0000005 * circleRadius;
        var botB = coords[0] - 0.0000005 * circleRadius;

        var newRectangle = new ymaps.Rectangle([[botB,leftB],[topB,rightB]], null, { draggable: false,fillColor: "#DB709330" });

        myMap.geoObjects.add(newRectangle);

        rectMap.push(newRectangle);



    });

    myMap.controls.add(listBox, {float: 'left'});
    selectTown();
    selectATM();
}

function addHexagons() {
    if (rectMap.length > 0) {
        

        for(var i = 0; i < rectMap.length; i++) {
            var bounds = rectMap[i].geometry.getBounds();
            var leftB = bounds[0][1];
            var rightB = bounds[1][1];
            var topB = bounds[1][0];
            var botB = bounds[0][0];

            const polygon = [
                [botB,leftB],
                [botB,rightB],
                [topB,rightB],
                [topB,leftB]
            ];  

            const hexagons = h3polygon(polygon);

            hexagonsId = [...new Set(hexagons)];

            // hexagonsId.push(hexagons);
            // hexagonsId = Array.from(new Set(hexagonsId));
        }

        //drawHexagons(hexagonsId);
    }
}

function getColor(targetH, maxT,minT) {
    var a = (targetH-minT) / (maxT-minT) * 100;
    if (a < 5) {
        return "#EFE4E3";
    } else if (a < 15) {
        return "#EFCBC9";
    }else if (a < 25) {
        return "#EFB7B3";
    }else if (a < 35) {
        return "#EFA19B";
    }else if (a < 45) {
        return "#EF8A83";
    }else if (a < 60) {
        return "#EF6960";
    }else if (a < 70) {
        return "#EF5248";
    }else if (a < 80) {
        return "#EF3C30";
    }else if (a < 90) {
        return "#EF2618";
    } else {
        return "#F00F00";
    }
}

function drawHexagons(hexData) {

    var minTarget = Infinity;
    var maxTarget = -Infinity;
    for(var i = 0; i < hexData.length; i++) {
        if(hexData[i].target > maxTarget) {
            maxTarget = hexData[i].target;
        }
        if(hexData[i].target < minTarget) {
            minTarget = hexData[i].target;
        }
    }

    for(var i = 0; i < hexData.length; i++) {
        const hexBoundary = h3.h3ToGeoBoundary(hexData[i].index);

        //var hexColor = hslToRgb(4, hexData[i].target / maxTarget * 100 ,94);

        var polygon = new ymaps.Polygon([
                // Координаты внешнего контура.
            hexBoundary
        ], {
            balloonContent: hexData[i].target
        }, {
            fillColor: getColor(hexData[i].target,maxTarget, minTarget),
            // Делаем полигон прозрачным для событий карты.
            interactivityModel: 'default#transparent',
            strokeWidth: 2,
            opacity: 0.5
        });
        myMap.geoObjects.add(polygon);
        // myMap.setBounds(polygon.geometry.getBounds());

    }
}

// ymaps.ready(init);

const selectTown = function () {
    var selectItem = document.getElementsByClassName("town_item");
    
    for(var i = 0; i < selectItem.length; i++) {
        selectItem[i].addEventListener('click', selectChoose);
    }

    function selectChoose() {
        var text = this.innerText;
        var buttonSelectTown = document.getElementsByClassName("dropbtn")[0];
        
        buttonSelectTown.innerText = text;

        var listbox = document.getElementById("my-listbox");
        var townRefs = listbox.getElementsByTagName("a");

        for(var i = 0; i < townRefs.length; i++) {
            if(townRefs[i].innerText === text) {
                townRefs[i].click();
            }
        }

    }
};

function openTownList() {
    document.getElementById("myDropdown").classList.toggle("show");    
}
  
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
};

// function addCircleToMap() {

// }


function openAtmList() {
    document.getElementById("myDropdown2").classList.toggle("show");    
}
  
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn2')) {
    var dropdowns = document.getElementsByClassName("dropdown-content2");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};

const selectATM = function () {
    var selectItem = document.getElementsByClassName("atm_item");

    
    for(var i = 0; i < selectItem.length; i++) {
        selectItem[i].addEventListener('click', selectChoose);
    }

    function selectChoose() {
        var text = this.innerText;
        var buttonSelectTown = document.getElementsByClassName("dropbtn2")[0];
        
        buttonSelectTown.innerText = text;
        if(text === "Общий доступ") {
            atmTYPE = "category1";
        }
        if(text === "ЗП") {
            atmTYPE = "category2";
        }
        if(text === "Отделение") {
            atmTYPE = "category3";
        }
        if(text === "Самоинкассация") {
            atmTYPE = "category4";
        }

    }
};

