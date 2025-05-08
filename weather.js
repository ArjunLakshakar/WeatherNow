// OpenWeatherMap API key
const API_KEY = '0e1f7753bc8a3809f7b3533b745a85fb';

// When the window loads
window.onload = () => {
    updateRecentCities(); // Show recent cities from localStorage
    if (navigator.geolocation) {
        // If geolocation is available, get user's current position
        navigator.geolocation.getCurrentPosition(pos => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        });
    }
};

// Map OpenWeatherMap icon codes to Weather Icons classes
function getWeatherIconClass(code) {
    const map = {
        "01d": "wi-day-sunny",
        "01n": "wi-night-clear",
        "02d": "wi-day-cloudy",
        "02n": "wi-night-alt-cloudy",
        "03d": "wi-cloud",
        "03n": "wi-cloud",
        "04d": "wi-cloudy",
        "04n": "wi-cloudy",
        "09d": "wi-showers",
        "09n": "wi-showers",
        "10d": "wi-day-rain",
        "10n": "wi-night-alt-rain",
        "11d": "wi-thunderstorm",
        "11n": "wi-thunderstorm",
        "13d": "wi-snow",
        "13n": "wi-snow",
        "50d": "wi-fog",
        "50n": "wi-fog"
    };
    return map[code] || "wi-na";
}

// Load and show recent cities from localStorage
function updateRecentCities() {
    const container = document.getElementById('recentCitiesContainer');
    const select = document.getElementById('recentCities');
    const recent = JSON.parse(localStorage.getItem('recentCities')) || [];

    if (recent.length) {
        container.classList.remove('hidden');
        select.innerHTML = '<option value="">Select a city</option>' +
            recent.map(city => `<option value="${city}">${city}</option>`).join('');
    } else {
        container.classList.add('hidden');
    }
}

// Triggered when user selects a recent city
function selectRecentCity(select) {
    if (select.value) {
        document.getElementById('cityInput').value = select.value;
        getWeather(); // Load weather for that city
    }
}

// Save a new recent city to localStorage
function saveRecentCity(city) {
    let recent = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recent.includes(city)) {
        recent.unshift(city);
        if (recent.length > 5) recent.pop();
        localStorage.setItem('recentCities', JSON.stringify(recent));
        updateRecentCities();
    }
}

// Fetch current weather using geographic coordinates
async function fetchWeatherByCoords(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    document.getElementById('cityInput').value = data.name;
    getWeather(); // Load weather for that location
}

// Button handler to use current location
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        }, () => {
            alert("Unable to retrieve your location.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Fetch and display current and forecast weather for a city
async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    const errorElem = document.getElementById('error');

    if (!city) {
        errorElem.textContent = 'Please enter a valid city name.';
        errorElem.classList.remove('hidden');
        return;
    }

    errorElem.classList.add('hidden');

    try {
        // Fetch current weather and 5-day forecast in parallel
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
        ]);

        const weather = await weatherRes.json();
        const forecast = await forecastRes.json();

        // Check if city is not found
        if (weather.cod !== 200 || forecast.cod !== "200") {
            throw new Error(weather.message || "City not found.");
        }

        saveRecentCity(city); // Save to recent cities list

        // Populate UI with current weather data
        document.getElementById('cityName').textContent = weather.name + ', ' + weather.sys.country;
        document.getElementById('date').textContent = new Date().toLocaleDateString();
        document.getElementById('description').textContent = weather.weather[0].description;
        document.getElementById('temperature').textContent = `${weather.main.temp.toFixed(1)}°`;
        document.getElementById('humidity').textContent = `${weather.main.humidity}%`;
        document.getElementById('wind').textContent = `${weather.wind.speed} km/h`;
        document.getElementById('feelsLike').textContent = `${weather.main.feels_like.toFixed(1)}°`;

        // Set weather icon
        const iconClass = getWeatherIconClass(weather.weather[0].icon);
        const iconElem = document.getElementById('weatherIcon');
        iconElem.className = `wi ${iconClass} text-5xl text-blue-600`;

        document.getElementById('precipitation').textContent = `${(Math.random() * 2).toFixed(1)} cm`;
        document.getElementById('uvIndex').textContent = Math.floor(Math.random() * 11);
        document.getElementById('rainChance').textContent = `${Math.floor(Math.random() * 100)}%`;

        // Display next 6 hourly forecasts
        const now = new Date();
        const hourlyContainer = document.getElementById('hourlyForecast');
        hourlyContainer.innerHTML = '';

        let added = 0;
        for (let i = 0; i < forecast.list.length && added < 6; i++) {
            const item = forecast.list[i];
            const forecastTime = new Date(item.dt_txt);
            if (forecastTime > now) {
                const hour = forecastTime.getHours().toString().padStart(2, '0') + ':00';
                const temp = `${item.main.temp.toFixed(0)}°`;

                hourlyContainer.innerHTML += `
                    <div class="bg-blue-100 rounded-xl p-3">
                        <p class="font-semibold">${hour}</p>
                        <p>${temp}</p>
                    </div>
                `;
                added++;
            }
        }

        // Display 5-day forecast (only the noon data points)
        const daily = forecast.list.filter(item => item.dt_txt.includes('12:00:00'));
        const forecastCards = document.getElementById('forecastCards');
        forecastCards.innerHTML = '';

        daily.forEach(day => {
            const icon = getWeatherIconClass(day.weather[0].icon);
            forecastCards.innerHTML += `
                <div class="bg-blue-100 rounded-xl p-4 text-center space-y-2">
                    <h4 class="font-semibold">${new Date(day.dt_txt).toLocaleDateString()}</h4>
                    <div class="flex items-center gap-2 justify-around"> 
                        <div class="flex flex-col gap-2 items-center "> 
                            <i class="wi ${icon} lg:text-4xl text-3xl text-blue-600"></i>
                            <p class="capitalize lg:text-md md:text-sm sm:text-xs ">${day.weather[0].description}</p>
                        </div>
                        <div class="lg:text-md md:text-sm sm:text-xs text-gray-700">
                            <p>Temp: ${day.main.temp.toFixed(1)}°</p>
                            <p>Humidity: ${day.main.humidity}%</p>
                            <p>Wind: ${day.wind.speed} km/h</p>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        errorElem.textContent = err.message; // Display any errors to user
        errorElem.classList.remove('hidden');
    }
}
