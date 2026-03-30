const WEATHER_API_KEY = 'b930a2668c53b3e0b66119a45d6e79be'; // Replace with your actual API key

export const fetchWeatherData = async (location) => {
  try {
    // Geocoding API to get coordinates from location name
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`
    );
    
    if (!geoResponse.ok) {
      throw new Error('Geocoding API failed');
    }
    
    const geoData = await geoResponse.json();
    
    if (!geoData || geoData.length === 0) {
      throw new Error('Location not found');
    }
    
    const { lat, lon } = geoData[0];
    
    // Weather API call
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API failed');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Forecast API call
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error('Forecast API failed');
    }
    
    const forecastData = await forecastResponse.json();
    
    return {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      rainChance: weatherData.rain ? Math.round(weatherData.rain['1h'] || 0) : 0,
      uvIndex: 'Moderate', // OpenWeatherMap doesn't provide UV index in free tier
      forecast: processForecastData(forecastData),
      locationName: geoData[0].name
    };
  } catch (error) {
    throw error;
  }
};

export const fetchWeatherSummary = async (location) => {
  try {
    // For widget, we only need current weather to keep it fast
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`
    );
    
    if (!geoResponse.ok) {
      throw new Error('Geocoding API failed');
    }
    
    const geoData = await geoResponse.json();
    
    if (!geoData || geoData.length === 0) {
      throw new Error('Location not found');
    }
    
    const { lat, lon } = geoData[0];
    
    // Only fetch current weather for widget (faster)
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API failed');
    }
    
    const weatherData = await weatherResponse.json();
    
    return {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6),
      rainChance: weatherData.rain ? Math.round(weatherData.rain['1h'] || 0) : 0,
    };
  } catch (error) {
    throw error;
  }
};

const processForecastData = (forecastData) => {
  // Process 5-day forecast data
  const dailyForecasts = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    if (!dailyForecasts[dayKey]) {
      dailyForecasts[dayKey] = {
        high: item.main.temp_max,
        low: item.main.temp_min,
        conditions: [item.weather[0].main],
        date: date
      };
    } else {
      dailyForecasts[dayKey].high = Math.max(dailyForecasts[dayKey].high, item.main.temp_max);
      dailyForecasts[dayKey].low = Math.min(dailyForecasts[dayKey].low, item.main.temp_min);
      dailyForecasts[dayKey].conditions.push(item.weather[0].main);
    }
  });
  
  // Convert to array format and get most common condition
  const forecastArray = Object.values(dailyForecasts)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);
  
  return forecastArray.map((dayData, index) => {
    const mostCommonCondition = getMostCommonCondition(dayData.conditions);
    
    return {
      day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : dayData.date.toLocaleDateString('en', { weekday: 'short' }),
      high: Math.round(dayData.high),
      low: Math.round(dayData.low),
      condition: mostCommonCondition
    };
  });
};

const getMostCommonCondition = (conditions) => {
  const counts = {};
  conditions.forEach(condition => {
    counts[condition] = (counts[condition] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};