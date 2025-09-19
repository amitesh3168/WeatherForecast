const apiKey = "1e3e8f230b6064d27976e41163a82b77";

const cityNameEl = document.getElementById("city-name");
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const weatherDescEl = document.getElementById("weather-desc");
const currentIconEl = document.getElementById("current-icon");

const forecastCardsEl = document.getElementById("forecast-cards");
const exploreCitiesEl = document.getElementById("explore-cities");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const themeToggleBtn = document.getElementById("toggle-theme");

// Map weather condition to FontAwesome icons (or you can swap to your own icons)
const weatherIconsMap = {
  clear: '<i class="fa-solid fa-sun"></i>',
  clouds: '<i class="fa-solid fa-cloud"></i>',
  rain: '<i class="fa-solid fa-cloud-showers-heavy"></i>',
  snow: '<i class="fa-solid fa-snowflake"></i>',
  mist: '<i class="fa-solid fa-smog"></i>',
  haze: '<i class="fa-solid fa-smog"></i>',
  thunderstorm: '<i class="fa-solid fa-bolt"></i>',
  default: '<i class="fa-solid fa-cloud-sun"></i>',
};

function getWeatherIcon(condition) {
  const key = condition.toLowerCase();
  return weatherIconsMap[key] || weatherIconsMap.default;
}

async function getWeatherByCity(city) {
  if (!city) return;

  try {
    const currentResp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    );

    if (!currentResp.ok) throw new Error("City not found");

    const currentData = await currentResp.json();

    displayCurrentWeather(currentData);

    const forecastResp = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    );
    if (!forecastResp.ok) throw new Error("Forecast not found");

    const forecastData = await forecastResp.json();

    displayForecast(forecastData);
  } catch (error) {
    alert(error.message);
  }
}

function displayCurrentWeather(data) {
  cityNameEl.textContent = data.name;
  temperatureEl.textContent = Math.round(data.main.temp) + "°C";
  humidityEl.innerHTML = `<i class="fa-solid fa-droplet"></i> Humidity: ${data.main.humidity}%`;
  windEl.innerHTML = `<i class="fa-solid fa-wind"></i> Wind: ${Math.round(data.wind.speed * 3.6)} km/h`; // m/s to km/h
  weatherDescEl.textContent = capitalize(data.weather[0].description);
  currentIconEl.innerHTML = getWeatherIcon(data.weather[0].main);
}

function displayForecast(data) {
  // Grouped daily forecast (show 1 per day)
  const daily = {};
  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) {
      daily[date] = item;
    }
  });

  forecastCardsEl.innerHTML = Object.values(daily)
    .slice(0, 5)
    .map((item) => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(item.main.temp);
      const icon = getWeatherIcon(item.weather[0].main);

      return `
        <div class="forecast-card" tabindex="0" aria-label="${dayName} forecast: ${temp} degrees Celsius, ${item.weather[0].description}">
          <div class="day-name">${dayName}</div>
          <div class="icon">${icon}</div>
          <div class="temp">${temp}°C</div>
        </div>
      `;
    })
    .join("");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Explore Section - Display random cities
const randomCities = ["London", "Paris", "New York", "Mumbai", "Tokyo", "Sydney", "Berlin", "São Paulo", "Dubai", "Moscow"];

async function loadExploreCities() {
  exploreCitiesEl.innerHTML = ""; // Clear first
  for (const city of randomCities) {
    try {
      const resp = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      const card = document.createElement("div");
      card.classList.add("city-card");
      card.tabIndex = 0;
      card.ariaLabel = `${data.name} weather: ${Math.round(data.main.temp)} degrees Celsius, ${data.weather[0].description}`;
      card.innerHTML = `
        <h4>${data.name}</h4>
        <div class="temp">${Math.round(data.main.temp)}°C</div>
        <div class="icon">${getWeatherIcon(data.weather[0].main)}</div>
      `;
      // Optionally add click to search this city
      card.addEventListener("click", () => {
        getWeatherByCity(data.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      exploreCitiesEl.appendChild(card);
    } catch {
      // ignore errors for individual cities
    }
  }
}

// Event Listeners

searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    getWeatherByCity(city);
    searchInput.value = "";
  }
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Initial Load: Try get user location & fallback to a default city
async function loadInitialWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // Reverse geocoding to get city name
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
          );
          const geoData = await res.json();
          if (geoData.length > 0) {
            getWeatherByCity(geoData[0].name);
          } else {
            getWeatherByCity("New York");
          }
        } catch {
          getWeatherByCity("New York");
        }
      },
      () => {
        getWeatherByCity("New York"); // User denied permission or error
      }
    );
  } else {
    // Geolocation not supported
    getWeatherByCity("New York");
  }
}

// Start app
loadInitialWeather();
loadExploreCities();
