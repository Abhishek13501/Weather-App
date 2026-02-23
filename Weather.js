// Configuration - Replace with your OpenWeather API key
const WEATHER_API_KEY = "3e687efff733139aa5d959fd95acd032";

let weather = {
    "apikey": WEATHER_API_KEY,
    
    fetchWeather: function (city) {
        const weatherDiv = document.querySelector(".weather");
        const searchBtn = document.querySelector(".search-btn");
        
        weatherDiv.classList.add("loading", "fetching");
        searchBtn.disabled = true;
        searchBtn.style.opacity = "0.5";
        document.querySelector(".error-message").style.display = "none";
        
        // Fetch current weather
        fetch("https://api.openweathermap.org/data/2.5/weather?q=" 
        + city 
        + "&units=metric&appid=" 
        + this.apikey)
        .then((response) => {
            if (!response.ok) {
                throw new Error("City not found. Please check the spelling and try again.");
            }
            return response.json();
        })
        .then((data) => {
            this.displayWeather(data);
            // Fetch 5-day forecast using coordinates
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&units=metric&appid=${this.apikey}`);
        })
        .then((response) => response.json())
        .then((forecastData) => {
            this.displayForecast(forecastData);
        })
        .catch((error) => {
            this.showError(error.message);
            weatherDiv.classList.remove("loading", "fetching");
        })
        .finally(() => {
            searchBtn.disabled = false;
            searchBtn.style.opacity = "1";
        });
    },

    displayWeather: function(data) {
        const { name, sys } = data;
        const { icon, description } = data.weather[0];
        const { temp, humidity, feels_like } = data.main;
        const windSpeed = (data.wind.speed * 3.6).toFixed(1); // Convert m/s to km/h
        const { sunrise, sunset } = sys;
        const country = sys.country;
        
        // Convert UNIX timestamp to readable time
        const sunriseTime = this.formatTime(sunrise, data.timezone);
        const sunsetTime = this.formatTime(sunset, data.timezone);
        
        // Update the HTML structure with weather data
        document.querySelector(".weather").innerHTML = `
            <h2 class="city">Weather in ${name}, ${country}</h2>
            <h1 class="temp">${Math.round(temp)}°C</h1>
            <div class="flex">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="icon" alt="Weather icon">
                <div class="description">${description}</div>
            </div>
            
            <div class="sun-times">
                <div class="sun-item">
                    <span class="sun-label">☀️ Sunrise</span>
                    <span class="sun-time">${sunriseTime}</span>
                </div>
                <div class="sun-item">
                    <span class="sun-label">🌙 Sunset</span>
                    <span class="sun-time">${sunsetTime}</span>
                </div>
            </div>
            
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="humidity">${humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="wind">${windSpeed} km/h</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Feels Like</div>
                    <div class="feels-like">${Math.round(feels_like)}°C</div>
                </div>
            </div>
            
            <div class="forecast-container">
                <h3 class="forecast-title">5-Day Forecast</h3>
                <div class="forecast-cards" id="forecast-cards"></div>
            </div>
        `;
        
        document.querySelector(".weather").classList.remove("loading", "fetching");
        document.querySelector(".error-message").style.display = "none";
        
        // Set background based on weather condition
        this.setBackground(data.weather[0].main);
    },

    displayForecast: function(data) {
        const forecastCards = document.getElementById("forecast-cards");
        const dailyForecasts = this.getDailyForecasts(data.list);
        
        forecastCards.innerHTML = dailyForecasts.map(day => `
            <div class="forecast-card">
                <div class="forecast-date">${day.date}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" class="forecast-icon" alt="Weather icon">
                <div class="forecast-temps">
                    <span class="temp-max">${day.maxTemp}°</span>
                    <span class="temp-min">${day.minTemp}°</span>
                </div>
            </div>
        `).join('');
    },

    getDailyForecasts: function(list) {
        const dailyData = {};
        
        // Group forecasts by date and get min/max temps
        list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: dateKey,
                    temps: [],
                    icon: item.weather[0].icon
                };
            }
            
            dailyData[dateKey].temps.push(item.main.temp);
        });
        
        // Convert to array and calculate min/max for each day
        const forecasts = Object.values(dailyData).map(day => ({
            date: day.date,
            icon: day.icon,
            maxTemp: Math.round(Math.max(...day.temps)),
            minTemp: Math.round(Math.min(...day.temps))
        }));
        
        // Return only 5 days
        return forecasts.slice(0, 5);
    },

    formatTime: function(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    setBackground: function(weatherCondition) {
        const backgrounds = {
            'Clear': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Clouds': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'Rain': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Drizzle': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            'Thunderstorm': 'linear-gradient(135deg, #434343 0%, #000000 100%)',
            'Snow': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
            'Mist': 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
            'Smoke': 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
            'Haze': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'Fog': 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
        };
        
        document.body.style.background = backgrounds[weatherCondition] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    },

    showError: function(message) {
        const errorElement = document.querySelector(".error-message");
        errorElement.innerText = message;
        errorElement.style.display = "block";
    },

    search: function() {
        const city = document.querySelector(".searchbar").value.trim();
        if (city) {
            this.fetchWeather(city);
        } else {
            this.showError("Please enter a city name");
        }
    }
};

document.querySelector(".search-btn").addEventListener("click", function() {
    weather.search();
});

document.querySelector(".searchbar").addEventListener("keyup", function(event){
    if(event.key === "Enter"){
        weather.search();
    }
});

// Focus on search input when page loads
window.addEventListener("load", function() {
    document.querySelector(".searchbar").focus();
});