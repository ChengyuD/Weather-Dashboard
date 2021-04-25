var apiKey = 'b95892ab2655be1053280b61fa3a5843';
var searchEl = document.querySelector('#searchForm');
var searchCityEl = document.querySelector('#searchCity');
var citiesListEl = document.querySelector('#userCityList');
var cityResultEl = document.querySelector('#cityResult');
var currentWeatherEl = document.querySelector('#currentWeather');
var forecastEl = document.querySelector('#fiveDayForecast');
var clearBtn = document.querySelector('#clearBtn');

var cities = JSON.parse(localStorage.getItem('cityResult')) || [];

var dtCitySearched;


var isEmpty = function(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1).toLowerCase();     
    }
    
    return splitStr.join(' '); 
 }

 
var formSubmitHandler = function(event) {
    event.preventDefault();
    
    var city = titleCase(searchCityEl.value.trim());
    
    if (city) {
        getCurrentWeather(city);
        searchCityEl.value = '';
    } else {
        alert('Please enter a city');
    }
};


var getCurrentWeather = function(cityName) {
    
    var apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=imperial&appid=${apiKey}`;
    
    fetch(apiURL)
    .then(response => response.json())
    .then(data => {
        displayCurrentWeather(data, cityName);
        return data.coord; 
    })
    .then(coord => {
        getUVindex(coord.lat, coord.lon); 
        get5dayForecast(coord.lat, coord.lon); 
    })
    .catch(error => {
        alert('Please check your entry');
        forecastEl.innerHTML = '';
        if (cities.includes(cityName)) {
            var index = cities.indexOf(cityName);
            if (index > -1) {
                cities.splice(index, 1);
            }
            localStorage.setItem('cityResult', JSON.stringify(cities));
            searchHistory();
        }
    });
};

var displayCurrentWeather = (data, cityName) => {
    currentWeatherEl.innerHTML = '';
    cityResultEl.textContent = cityName;

    if (!cities.includes(cityName)) {
        cities.push(cityName); 
        cities.sort();
        localStorage.setItem('cityResult', JSON.stringify(cities));
        searchHistory();
    }

    if (isEmpty(data)) {
        currentWeatherEl.textContent = 'No weather data found for this city.';
        return;
    }

    dtCitySearched = moment.unix(data.dt + data.timezone).utc().format('M/DD/YYYY, h:mm a');

    var iconId = data.weather[0].icon;
    cityResultEl.innerHTML = `${cityName} (${dtCitySearched}) <span id="weather-icon"><img src="https://openweathermap.org/img/wn/${iconId}@2x.png"/></span>`;

    var temperatureEl = document.createElement('p');
    temperatureEl.textContent = 'Temperature: ' + data.main.temp + ' °F';
    currentWeatherEl.appendChild(temperatureEl);

    var humidityEl = document.createElement('p');
    humidityEl.textContent = 'Humidity: ' + data.main.humidity + '%';
    currentWeatherEl.appendChild(humidityEl);

    var windSpeedEl = document.createElement('p');
    windSpeedEl.textContent = 'Wind Speed: ' + data.wind.speed + ' MPH';
    currentWeatherEl.appendChild(windSpeedEl);
}

var getUVindex = (lat, lon) => {
    var apiURL = `https://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${lat}&lon=${lon}`;
    fetch(apiURL)
    .then(response => response.json())
    .then(data => {
        var index = parseFloat(data.value);
        displayUVindex(index);
    })
    .catch(error => alert('UV index error'));
}

var displayUVindex = index => {
    var indexClass;
    if (index < 3) {
        indexClass = 'bg-success';      
    }
    else if (index < 6) {
        indexClass = 'bg-warning';
    }
    else {
        indexClass = 'bg-danger';
    }

    var UVindexEl = document.createElement('p');
    UVindexEl.innerHTML = `UV index: <span class="${indexClass} p-2 text-white rounded">${index}</span>`;
    currentWeatherEl.appendChild(UVindexEl);
};

var get5dayForecast = (lat, lon) => {
    var apiURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    fetch(apiURL)
    .then(response => response.json())
    .then(data => display5dayForecast(data))
    .catch(error => alert('5-day forecast error'));
};


var display5dayForecast = data => {
    forecastEl.innerHTML = '<h4 class="d-block pt-4 pb-2">5-Day Forecast <span id="time-forecast"></span></h4>';
    var cardsContainerEl = document.createElement('div');
    cardsContainerEl.setAttribute('class', 'row');

    var firstForecast;
    var todayStartOfHour = moment(dtCitySearched, 'M/DD/YYYY, h:mm a').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    var todaySixAM = moment(dtCitySearched, 'M/DD/YYYY, h:mm a').format('YYYY-MM-DD') + ' 06:00:00';
    if (todayStartOfHour > todaySixAM) {  
        firstForecast = moment(dtCitySearched, 'M/DD/YYYY, h:mm a').add(1, 'd').format('YYYY-MM-DD') + ' 12:00:00';
    } else { 
        firstForecast = moment(dtCitySearched, 'M/DD/YYYY, h:mm a').format('YYYY-MM-DD') + ' 12:00:00';
    }

    var arrDays = data.list;
    console.log(arrDays);
    var startIndex;
    arrDays.forEach(day => {
        if (day.dt_txt === firstForecast) {
            startIndex = arrDays.indexOf(day);
            return;
        }
    });

    for (i=startIndex; i< arrDays.length; i+=8) {
        var dayForecastEl = document.createElement('div');
        dayForecastEl.setAttribute('class', 'mx-auto');
        var cardEl = document.createElement('div');
        cardEl.setAttribute('class', 'card bg-primary text-white');
        var cardBodyEl = document.createElement('div');
        cardBodyEl.setAttribute('class', 'card-body');

        var date = moment(arrDays[i].dt_txt.split(' ')[0], 'YYYY-MM-DD').format('M/DD/YYYY');
        var dateEl = document.createElement('label');
        dateEl.setAttribute('class', 'cityResult');
        dateEl.textContent = `${date}`;
        cardBodyEl.appendChild(dateEl);

        var iconId = arrDays[i].weather[0].icon;
        if (iconId[iconId.length-1] === 'n') {
            iconId = iconId.slice(0, -1) + 'd';
        }
        var iconEl = document.createElement('i');
        iconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconId}.png"/>`;
        cardBodyEl.appendChild(iconEl);

        var tempEl = document.createElement('p');
        tempEl.setAttribute('class', 'card-text');
        tempEl.textContent = `Temp: ${arrDays[i].main.temp} °F`;
        cardBodyEl.appendChild(tempEl);

        var humidityEl = document.createElement('p');
        humidityEl.setAttribute('class', 'card-text');
        humidityEl.textContent = `Humidity: ${arrDays[i].main.humidity} %`;
        cardBodyEl.appendChild(humidityEl);

        cardEl.appendChild(cardBodyEl);
        dayForecastEl.appendChild(cardEl);
        cardsContainerEl.appendChild(dayForecastEl);
    };

    forecastEl.appendChild(cardsContainerEl);
}

var searchHistory = () => {
    citiesListEl.innerHTML = '';

    cities.forEach(function (city){
        var cityEl = document.createElement('li');
        cityEl.setAttribute('class', 'list-group-item');
        cityEl.textContent = city;
        citiesListEl.appendChild(cityEl);
    });
};

var cityClickHandler = event => {
    var cityName = event.target.textContent;
    getCurrentWeather(cityName);
}

var clearSearchHistory = () => {
    cities = [];
    localStorage.setItem('cityResult', JSON.stringify(cities));
    searchHistory();
}

searchEl.addEventListener('submit', formSubmitHandler);
citiesListEl.addEventListener('click', cityClickHandler);
clearBtn.addEventListener('click', clearSearchHistory);

searchHistory();
