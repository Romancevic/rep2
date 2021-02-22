// Global variables
// initialize the map
var map = L.map('map', {zoomControl:false}).fitWorld();
// new L.Control.Zoom({position: 'bottomleft'}).addTo(map);
var lng = 0;
var lat = 0;
var area = 0;
var country = "";
var capital = "";
var currency = "";
var issTimeoutID;
var issMarker;
var issCircle;
var locationMarker;
var bounds;
var issIcon = L.icon({
    iconUrl: '././media/img/iss.png',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    popupAnchor: [-3, 16]
});

var locationIcon = L.icon({
    iconUrl: '././media/img/location.png',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -10]
});

var polyStyle = {
    "color": "violet",
    "weight": 5,
    "opacity": 0.9
};

// Initialize the map with user location and specifies accuracy in pop up window on the map
function loadMap(){
    // load a tile layer
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,  Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/dark-v10',
  //       style: 'mapbox://styles/romancevic/ckjbckcml0k2n19ted911sr0h', // style URL
        tileSize: 512,
        zoomOffset: -1,

        accessToken: 'pk.eyJ1Ijoicm9tYW5jZXZpYyIsImEiOiJja2oydWticHE1YWxlMzFxanhwZWY0cXV2In0.8SvxMB7LG3xmbsig-XnR_Q'

        }).addTo(map);

  //      mapboxgl.accessToken = 'pk.eyJ1Ijoicm9tYW5jZXZpYyIsImEiOiJja2oydWticHE1YWxlMzFxanhwZWY0cXV2In0.8SvxMB7LG3xmbsig-XnR_Q';
  //          var map = new mapboxgl.map({
  //              container: 'map', // container id
  //              style: 'mapbox://styles/romancevic/ckjbckcml0k2n19ted911sr0h', // style URL
  //              center: [-74.5, 40], // starting position [lng, lat]
  //              zoom: 9 // starting zoom
  //          });

//  mapbox://styles/mapbox/streets-v11
//mapbox://styles/mapbox/outdoors-v11
//mapbox://styles/mapbox/light-v10
//mapbox://styles/mapbox/dark-v10
//mapbox://styles/mapbox/satellite-v9
//mapbox://styles/mapbox/satellite-streets-v11
//mapbox://styles/mapbox/navigation-preview-day-v4
//mapbox://styles/mapbox/navigation-preview-night-v4
//mapbox://styles/mapbox/navigation-guidance-day-v4
//mapbox://styles/mapbox/navigation-guidance-night-v4


    // Location found handler
    function onLocationFound(e) {
        //console.log(e);

        $.ajax({
            url: "libs/php/getUserCountryCode.php",
            type: 'POST',
            dataType: 'json',
            data: {
                lat: e['latlng']['lat'],
                lng: e['latlng']['lng']
            },
            success: function(result){
                //console.log(result);

              	setFlag(result['data']);

                $.ajax({
                    url: "libs/php/getCountryInfo.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        country: result['data'],
                        lang: 'en'
                    },
                    success: function(result){
                        //console.log(result);
                        if(result.status.code == 200){
                           setCountryInfo(result);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        alert(`#1 ${textStatus} error in country info`);
                    }
                });
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert(`#2 ${textStatus} error in country info`);
            }
        });
    }

    // Error handler
    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({setView: false, maxZoom: 16});
}

function setCountryInfo(result) {
    $('#apiCont').empty();
    
    $.ajax({
        url: "libs/php/getArticles.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: result['data'][0]['countryName']
        },
        success: function(data){
            if (data) {
                data = data['articles']['results'];
                let main = data[0];
                let API = new APINews('News');

                Object.defineProperty(main, 'description',
                    Object.getOwnPropertyDescriptor(main, 'body'));
                delete main['body'];

                Object.defineProperty(main, 'urlToImage',
                    Object.getOwnPropertyDescriptor(main, 'image'));
                delete main['image'];

                if (main['authors'][0]) {
                    main['author'] = main['authors'][0]['name']

                    main['description'] = main['description'].length > 200 ? main['description'].slice(0, 200) + '...' : main['description'];

                    API.addInfos([main])

                    API.setUp($('#apiCont'))
                }
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#5 ${textStatus} error in articles info`);
        }
    });

    /* --------------------------------------- */

    $.ajax({
        url: "libs/php/getCovid.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: result['data'][0]['countryName']
        },
        success: function(data) {
            if (data.length) {
                let main = data[data.length-1];
                let API = new APIComponent('Coronavirus News', 'Stay Safe');

                API.addInfos([
                    {
                        title: 'Confirmed',
                        text: main['Confirmed']
                    },
                    {
                        title: 'Recovered',
                        text: main['Recovered'],
                    },
                    {
                        title: 'Deaths',
                        text: main['Deaths'],
                    },
                    {
                        title: 'Last Update',
                        text: main['Date'],
                        size: 'wide'
                    }
                ])

                API.setUp($('#apiCont'))
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in covid-19 info`);
        }
    });

    fetch('../../iso.json')
        .then(iso => iso.json())
        .then(iso => {
            $.ajax({
                url: "libs/php/getBorders.php",
                type: 'POST',
                dataType: 'json',
                data: {
                    code: encodeURI(result['data'][0]['countryCode'])
                },
                success: function(data) {
                    let main = data['borders'];

                    if (data['borders']) {
                        main = main.map(it => {
                            let ret = null;

                            for (let i = 0; i < iso.length; i++) {
                                if (iso[i]['alpha-3'] == it) {
                                    ret = iso[i]['alpha-2'];
                                    break;
                                }
                            }

                            if (ret) {
                                return ret;
                            } else {
                                return 'be'
                            }
                        });

                        let API = new APIBorders('Borders');

                        API.addInfos(main)

                        API.setUp($('#apiCont'))
                    }

                    /* ----------------------------- */

                    if (data['timezones']) {
                        let timezones = data['timezones'];

                        timezones = timezones.map(item => {
                            return {
                                title: item
                            }
                        })

                        let APITimezones = new APIComponent('Timezones');

                        APITimezones.addInfos(timezones)

                        APITimezones.setUp($('#apiCont'))
                    }

                    /* ----------------------------- */

                    if (data['currencies'][0]['code']) {
                        $.ajax({
                            url: "libs/php/getCurrencies.php",
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                code: encodeURI(data['currencies'][0]['code'])
                            },
                            success: function(info) {
                                let put = [
                                    {
                                        details: info,
                                        currency: data['currencies'][0]['code']
                                    }
                                ];

                                let APICurr = new APICurrency('Currency');

                                APICurr.addInfos(put);

                                APICurr.setUp($('#apiCont'))
                            },
                            error: function(jqXHR, textStatus, errorThrown){
                                alert(`#7 ${textStatus} error in currency info`);
                            }
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    alert(`#5 ${textStatus} error in borders info`);
                }
            });
        })

    $.ajax({
        url: "libs/php/getWeatherCountry.php",
        type: 'POST',
        dataType: 'json',
        data: {
            capital: encodeURI(result['data'][0]['capital'])
        },
        success: function(info) {
            if (info) {
                let data = info['current'];

                /* ---------------------------------------- */

                let API = new APIComponent('Current Weather');

                API.addInfos([
                    {
                        title: 'Cloud Cover',
                        text: catcher(data['cloudcover']),
                    },
                    {
                        title: 'Temperature',
                        text: catcher(data['temperature']),
                    },
                    {
                        title: 'Feels Like',
                        text: catcher(data['feelslike']),
                    },
                    {
                        title: 'Visibility',
                        text: catcher(data['visibility']),
                    },
                    {
                        title: 'Wind Speed',
                        text: catcher(data['wind_speed']),
                    },
                    {
                        title: 'Wind Degree',
                        text: catcher(data['wind_degree']),
                    },
                    {
                        title: catcher(data['weather_descriptions'][0]),
                        image: data['weather_icons'][0]
                    },
                ])

                API.setUp($('#apiCont'))
            }

            /* ---------------------------------------- */

            if (info) {
                let main = info['forecast'][Object.keys(info['forecast'])[0]];

                let APIForecst = new APIComponent('Weather Forecast');

                APIForecst.addInfos([
                    {
                        title: 'Average Temp.',
                        text: catcher(main['avgtemp']),
                    },
                    {
                        title: 'Max Temp.',
                        text: catcher(main['maxtemp']),
                    },
                    {
                        title: 'Min Temp',
                        text: catcher(main['mintemp']),
                    },
                    {
                        title: 'Total Snow',
                        text: catcher(main['totalsnow']),
                    },
                    {
                        title: 'Sun Hour',
                        text: catcher(main['sunhour']),
                    },
                ])

                APIForecst.setUp($('#apiCont'))
            }

            /* ---------------------------------------- */

            if (info) {
                let night = info['forecast'][Object.keys(info['forecast'])[0]]['astro'];

                let APINight = new APIComponent('Astro Info');

                APINight.addInfos([
                    {
                        title: 'Moon Illumination',
                        text: catcher(night['moon_illumination']),
                    },
                    {
                        title: 'Moon Phase',
                        text: catcher(night['moon_phase']),
                    },
                    {
                        title: 'Moon Rise',
                        text: catcher(night['moonrise']),
                    },
                    {
                        title: 'Moon Set',
                        text: catcher(night['moonset']),
                    },
                    {
                        title: 'Sun Rise',
                        text: catcher(night['sunrise']),
                    },
                    {
                        title: 'Sun Set',
                        text: catcher(night['sunset']),
                    },
                ])

                APINight.setUp($('#apiCont'))
            }

            /* ---------------------------------------- */
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#8 ${textStatus} error in weather info`);
        }
    });


    showInfoBtn();
    $('#continent').html(result['data'][0]['continent']);
    capital = result['data'][0]['capital'];
    currency = result['data'][0]['currencyCode'];
    country = result['data'][0]['isoAlpha3'];
  	setCountry(result['data'][0]['countryName']);
    $('#capital').html(capital);
    $('#languages').html(result['data'][0]['languages']);
    $('#population').html(formatPopulation(result['data'][0]['population']));
    lng = (result['data'][0]['north'] + result['data'][0]['south']) / 2;
    lat = (result['data'][0]['east'] + result['data'][0]['west']) / 2;
    $('#area').html(`${formatArea(result['data'][0]['areaInSqKm'])} km<sup>2</sup>`);
    getGeoJson();
    callGeolocation(lng, lat);
}

function catcher(x, y='No Info') {
    return x || y;
}

class API {
    constructor(title, note) {
        this.title = title || 'Example Title';
        this.note = note;
        this.info = [];
    }

    setUp(element) {
        element.append(this.generateHTML());

        return 1;
    }

    addInfo(info) {
        this.info.push(info);

        return 1;
    }

    addInfos(infos) {
        infos.forEach(info => {
            this.addInfo(info);
        })

        return 1;
    }

    generateHTML() {

    }
}


class APIComponent extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        let container = $(`<div class="api"></div>`);
        let title_container = $(`<div class="api-main-title">${this.title}</div>`);
        let information = $(`<div></div>`);

        let note_container;
        if (this.note) {
            note_container = $(`<div class="api-main-note">${this.note}</div>`);
        }

        container.append(title_container);

        if (this.info.length > 0) {
            this.info.forEach(item => {
                let info = $(`<div class="api-container ${item.size ? item.size : ''}"></div>`);

                if (item.title) {
                    info.append($(`<div class="api-title">${item.title}</div>`));
                }

                if (item.text) {
                    info.append($(`<div class="api-text">${item.text}</div>`));
                }

                if (item.image) {
                    info.append($(`<img class="api-image" src="${item.image}"/>`));
                }

                if (item.note) {
                    info.append($(`<div class="api-note">${item.note}</div>`));
                }

                if (item.link) {
                    info.append($(`<a href="${item.link}" class="api-link" target="_blank">Get More</a>`));
                }

                information.append(info);
            });

            container.append(information);

            if (this.note) {
                container.append(note_container);
            }

            return container;
        } else {
            return 0;
        }
    }
}

class APINews extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        let container = $(`<div class="news_list"></div>`);

        this.info.forEach(item => {
            let item_container = $(`<div class="news_item"></div>`);
            let link = $(`<a href="${item.url}" target="_blank"></a>`);
            let news_title = $(`<div class="news_title">${item.title}</div>`);
            let news_description = $(`<div class="news_description">${item.description}</div>`);
            let news_author;

            link.append(news_title);
            link.append(news_description);

            if (item.author) {
                news_author = $(`<div class="news_author">${item.author}</div>`);
                link.append(news_author);
            }

            item_container.css(`background-image`, `linear-gradient(90deg, rgba(0,0,0,1) 10%, rgba(0,15,18,1) 19%, rgba(0,212,255,0) 100%), url('${item['urlToImage']}')`);

            item_container.append(link);
            container.append(item_container);
        })


        return container;
    }
}

class APIBorders extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        let container = $(`<div class="borders_list"></div>`);
        let main_title = $(`<div class="borders_title">${this.title}</div>`);

        container.append(main_title);

        this.info.forEach(item => {
            let item_container = $(`<div class="border"></div>`);
            let flag = $(`<div><img src="https://www.countryflags.io/${item}/shiny/64.png"/></div>`);
            let country = $(`<div onclick="updateCounry(${item})">${item}</div>`);

            item_container.append(flag);
            item_container.append(country);
            container.append(item_container);
        })


        return container;
    }
}

class APICurrency extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        let container = $(`<div class="currency"></div>`);
        let divider = $(`<div class="currency_divider">USD/${this.info[0].currency}</div>`)

        let insert = $(`<input value="1" onchange="currencyChange(${this.info[0].details.rates[this.info[0].currency]}, false)" id="currency_input"/>`)
        let output = $(`<input value="${this.info[0].details.rates[this.info[0].currency]}" onchange="currencyChange(${this.info[0].details.rates[this.info[0].currency]}, true)" id="currency_output"/>`)

        container.append(insert);
        container.append(output);
        container.append(divider);

        return container;
    }
}

function currencyChange(k, reverse) {
    k = k*1;

    if (reverse) {
        $('#currency_input').val(($('#currency_output').val() * (1/k)).toFixed(3))
    } else {
        $('#currency_output').val(($('#currency_input').val() * k).toFixed(3))
    }
}

// Handles map click event
function onMapClick(e) {

	$('.loadingCountry').show();

    $.ajax({
        url: "libs/php/getUserCountryCode.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: e['latlng']['lat'],
            lng: e['latlng']['lng']
        },
        success: function(result){
            setFlag(result['data']);
            $.ajax({
                url: "libs/php/getCountryInfo.php",
                type: 'POST',
                dataType: 'json',
                data: {
                    country: result['data'],
                    lang: 'en'
                },
                success: function(result){

                	if(result.data[0].countryName == $('#country-name').text()) {

                		$('.loadingCountry').hide();

                		return false;
                	}
                    if(result.status.code == 200){
                       setCountryInfo(result);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    alert(`${textStatus} error in user country info`);
                }
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#3 ${textStatus} error in country info`);
        }
    });
}

map.on('click', onMapClick);

// Handles country selection option event
$('#selectCountry').change(function(){

	$('.loadingCountry').show();

    showInfoBtn();
    emptyTable('#table2');
    stopISS();
    $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectCountry').val(),
            lang: 'en'
        },
        success: function(result){

        	if(result.data[0].countryName == $('#country-name').text()) {

        		$('.loadingCountry').hide();

        		return false;
        	}

            if(result.status.code == 200){
               setFlag($('#selectCountry').val());
               setCountryInfo(result);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in country info`);
        }
    });
});

function updateCounry(code) {
    showInfoBtn();
    emptyTable('#table2');
    stopISS();
    $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: code,
            lang: 'en'
        },
        success: function(result){

            if(result.data[0].countryName == code) {

                $('.loadingCountry').hide();

                return false;
            }

            if(result.status.code == 200){
                setFlag(code);
                setCountryInfo(result);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in country info`);
        }
    });
}

// info modal button trigger handler
$('#infoModal').on('shown.bs.modal', function () {
    $('#myInput').trigger('focus');
  });

function callGeolocation(lng, lat) {
    $.ajax({
        url: "libs/php/getGeolocation.php",
        type: 'POST',
        dataType: 'json',
        data: {
            q: (lng).toString() + ',' + (lat).toString(),
            lang: 'en'
        },
        success: function(result){

            //console.log(result);

            if(result.status.code == 200){
                $('#currency').html(currency);
                getWeatherData();
                getExchangeRateData();
                getISSData();
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`${textStatus} error in geolocation`);
        }
    });
}

// handles ISS tracking mode
$('#btnISS').click(function() {
    if($('#btnISS').html() === 'Track ISS'){
        hideInfoBtn();
        trackISS();
    $('#btnISS').html('Stop ISS');
    }else {
        stopISS();
        $('#btnISS').html('Track ISS');
        map.locate({setView: true, maxZoom: 5});
    }
});

// Updates map with specified latitude and longitude(west subtracted from east)
function updateMarker(lng, lat){
	//console.log(lng, lat)
    if(locationMarker != undefined){
        map.removeLayer(locationMarker);
    }
    locationMarker = L.marker([lng, lat], {icon: locationIcon}).addTo(map);
    $('.loadingCountry').hide();
};


// handles ISS tracking on the map updating it every 3 sec with custom marker
function trackISS () {
    $.ajax({
        url: "libs/php/getIssPosition.php",
        type: 'GET',
        dataType: 'json',
        success: function(result){
            //console.log(result);
            if(result){
                updateISSMarker(result['latitude'],
                result['longitude']);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in ISS pos: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
     issTimeoutID = setTimeout(trackISS, 3000);
}

// ISS marker and circle update function
function updateISSMarker(lat, lon) {
    if(issMarker != undefined && issCircle != undefined){
        map.removeLayer(issMarker);
        map.removeLayer(issCircle);
    }
    issMarker = new L.marker([lat, lon], {icon: issIcon}).addTo(map);
    issCircle = new L.circle([lat, lon], {color: 'gray', opacity: .5}).addTo(map);

    map.flyTo([lat, lon], zoomOffset=5, animate=true);
}

// stops ISS tracking on map
function stopISS() {
    clearTimeout(issTimeoutID);
}

// get current weather open weather api
function getWeatherData(){
    $.ajax({
        url: "libs/php/getWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            q: capital
        },
        success: function(result){
            if(result.cod == 200){
                //console.log(result);
                $('#temperature').html(`${Math.floor(parseFloat(result['main']['temp']) - 273.15)} <sup>o</sup>C`);
                $('#humidity').html(`${result['main']['humidity']} %`);
                $('#pressure').html(`${result['main']['pressure']} hPa`);
                lng = result['coord']['lon'];
                lat = result['coord']['lat'];
                updateMarker(result['coord']['lat'], result['coord']['lon']);
            } else {
            	$('.loadingCountry').hide();
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in weather: ${textStatus} : ${errorThrown} : ${jqXHR}`);
        }
    });
}

// get exchange rate open exchange rate api
function getExchangeRateData() {
	return false;
    $.ajax({
        url: "libs/php/getExchangeRate.php",
        type: 'GET',
        dataType: 'json',
        success: function(result){
            if(result){
                //console.log(result);
                $('#exchangeTitle').html(`USD/${currency} XR:`);
                $('#exchangeRate').html(result['rates'][currency]);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in exchange: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
}

// get iss pass data from n2yo api
function getISSData() {
	return false;
    $.ajax({
        url: "libs/php/getIssData.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng
        },
        success: function(result){
            if(result['passes']){
                //console.log(result);
                $('#issPass').html(`Predicted ISS passes for next 10 days over ${capital}`);
                if(result['passes']){
                    result['passes'].forEach(function (d) {
                        var date = new Date(d['startUTC']*1000);
                        $('#table2').append('<tr><th>' + "<img src='././media/img/iss.svg'></img>" + '</th><td>' + date.toString() + '</td></tr>');
                    }
                    );
                }else {
                    $('#issPass').html(`No visible ISS passes over ${capital} in next 10 days`);
                }
            }else {
                $('#issPass').html(`No visible ISS passes over ${capital} in next 10 days`);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in iss data: ${textStatus} : ${errorThrown} : ${jqXHR}`);
        }
    });
}

  // get specific country border data from geojson file
function getGeoJson() {
    $.ajax({
        url: "libs/php/getCountryPolygon.php",
        type: 'POST',
        dataType: 'json',
        data: {
            iso3: 'it',
            country: country
        },
        success: function(result){
            if(result){
                if (result.data.countryInfo.geonames.length > 0) {
                    if(bounds != undefined){
                        map.removeLayer(bounds);
                    }
                    bounds = L.geoJSON(result.data.border, {style: polyStyle}).addTo(map);
                    map.flyToBounds(bounds.getBounds(), {
                        animate: true,
                        duration: 2.5
                    });
               //     locationMarker.bindPopup(`Capital: ${capital}`).openPopup();
                } else {
                    alert('Данные для данного места не найдены!')
                }
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in geojson: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
}

function emptyTable(tabID) {
    $(tabID).empty();
}

function startTime() {
    $('#date-time').html(`Date: ${new Date().toLocaleString()}`);
    setTimeout(startTime, 1000);
}

function showInfoBtn() {
    $('#btnInfo').css("display", "block");
}

function hideInfoBtn() {
    $('#btnInfo').css("display", "none");
}

function formatPopulation(num){
    let pop = parseInt(num);
    if(pop/1000000 > 1){
        return `${(pop/1000000).toFixed(2)} mln`;
    }else if(pop/1000 > 1){
        return `${(pop/1000).toFixed(2)} k`;
    }else {
        return `${pop.toFixed()}`;
    }
}

function formatArea(num){
    let area = Number(num).toPrecision();
    if(area/1000000 > 1){
        return `${(area/1000000).toFixed(2)} mln`;
    }else if(area/1000 > 1) {
        return `${(area/1000).toFixed(2)} k`
    }else {
        return `${area}`;
    }
}

function setCountry(countryName) {
    $('#country-name').html(countryName);
}

function setFlag(iso2code) {
    $('#country-flag').html(`<img src="https://www.countryflags.io/${iso2code}/shiny/64.png"></img>`);
}
