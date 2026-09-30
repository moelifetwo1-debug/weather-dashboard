import { useEffect, useMemo, useState } from 'react';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const DEFAULT_CITY = 'London';

const formatTemp = (value) => `${Math.round(value)}°C`;
const formatWind = (value) => `${Math.round(value)} km/h`;
const formatHumidity = (value) => `${Math.round(value)}%`;

const getWeatherIcon = (code) => {
  if (!code) return '☀️';

  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800) return '☀️';
  if (code > 800) return '☁️';

  return '🌤️';
};

const getDayLabel = (timestamp) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(timestamp * 1000));

const getTimeLabel = (timestamp) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));

const fetchWeather = async (city) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Unable to fetch weather data.');
  }

  const data = await response.json();

  if (!data || !data.main || !Array.isArray(data.weather) || data.weather.length === 0) {
    throw new Error('Unexpected weather response from the API.');
  }

  return data;
};

const fetchForecast = async (city) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Unable to fetch forecast data.');
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.list)) {
    throw new Error('Unexpected forecast response from the API.');
  }

  return data;
};

const filterDailyForecast = (forecastList) => {
  const uniqueDays = new Map();

  forecastList.forEach((entry) => {
    const dayKey = new Date(entry.dt * 1000).toISOString().slice(0, 10);
    if (!uniqueDays.has(dayKey)) {
      uniqueDays.set(dayKey, entry);
    }
  });

  return Array.from(uniqueDays.values()).slice(0, 5);
};

const getWeatherSummary = (weather) => {
  if (!weather?.main || !Array.isArray(weather.weather) || weather.weather.length === 0) {
    return null;
  }

  const main = weather.main;
  const details = weather.weather[0];

  return {
    temp: formatTemp(main.temp),
    feelsLike: formatTemp(main.feels_like),
    condition: details.main,
    description: details.description,
    sunrise: weather.sys ? getTimeLabel(weather.sys.sunrise) : '—',
    sunset: weather.sys ? getTimeLabel(weather.sys.sunset) : '—',
    humidity: formatHumidity(main.humidity),
    wind: formatWind(weather.wind?.speed ?? 0),
    visibility: `${Math.round((weather.visibility ?? 0) / 1000)} km`,
  };
};

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = async (selectedCity) => {
    if (!selectedCity.trim()) {
      setError('Please enter a city name.');
      return;
    }

    if (!API_KEY) {
      setError('Add your OpenWeatherMap API key to the .env file to enable live weather data.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [currentWeather, forecastData] = await Promise.all([
        fetchWeather(selectedCity),
        fetchForecast(selectedCity),
      ]);

      setWeather(currentWeather);
      setForecast(filterDailyForecast(forecastData.list || []));
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching the weather.');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(DEFAULT_CITY);
  }, []);

  const summary = useMemo(() => getWeatherSummary(weather), [weather]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadWeather(city);
  };

  return (
    <div className="app-shell">
      <div className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Weather dashboard</p>
            <h1>Climate overview</h1>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Search city"
              aria-label="City search"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
          </form>
        </header>

        {error ? <div className="alert">{error}</div> : null}

        {!weather && !loading ? null : (
          <main className="content-grid">
            <section className="primary-panel card">
              {weather && summary ? (
                <>
                  <div className="location-row">
                    <div>
                      <p className="label">Current location</p>
                      <h2>{weather.name}</h2>
                    </div>
                    <span className="weather-icon">
                      {getWeatherIcon(weather.weather?.[0]?.id)}
                    </span>
                  </div>

                  <div className="temperature-row">
                    <div className="temperature">{summary.temp}</div>
                    <div className="condition-copy">
                      <strong>{summary.condition}</strong>
                      <span>{summary.description}</span>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <span>Feels like</span>
                      <strong>{summary.feelsLike}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Humidity</span>
                      <strong>{summary.humidity}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Wind</span>
                      <strong>{summary.wind}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Visibility</span>
                      <strong>{summary.visibility}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">Loading weather data...</div>
              )}
            </section>

            <section className="secondary-panel card">
              <p className="label">Sunrise & sunset</p>
              {weather && summary ? (
                <div className="sun-times">
                  <div>
                    <span>🌅 Sunrise</span>
                    <strong>{summary.sunrise}</strong>
                  </div>
                  <div>
                    <span>🌇 Sunset</span>
                    <strong>{summary.sunset}</strong>
                  </div>
                </div>
              ) : null}
              <div className="meta-list">
                <div>
                  <span>Timezone</span>
                  <strong>{weather ? Intl.DateTimeFormat().resolvedOptions().timeZone : '—'}</strong>
                </div>
                <div>
                  <span>Pressure</span>
                  <strong>{weather?.main?.pressure ? `${weather.main.pressure} hPa` : '—'}</strong>
                </div>
                <div>
                  <span>Cloud cover</span>
                  <strong>{weather?.clouds?.all !== undefined ? `${weather.clouds.all}%` : '—'}</strong>
                </div>
              </div>
            </section>
          </main>
        )}

        <section className="forecast-panel card">
          <div className="section-heading">
            <p className="label">5-day forecast</p>
            <h3>Next outlook</h3>
          </div>

          <div className="forecast-grid">
            {forecast.length > 0 ? (
              forecast.map((entry) => (
                <article key={entry.dt} className="forecast-item">
                  <span className="forecast-day">{getDayLabel(entry.dt)}</span>
                  <div className="forecast-icon">{getWeatherIcon(entry.weather?.[0]?.id)}</div>
                  <strong>{entry.weather?.[0]?.main || 'Weather'}</strong>
                  <div className="forecast-temp">
                    <span>{formatTemp(entry.main?.temp_max ?? 0)}</span>
                    <span>{formatTemp(entry.main?.temp_min ?? 0)}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state forecast-empty">No forecast data available yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
