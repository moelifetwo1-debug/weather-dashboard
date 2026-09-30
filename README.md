# Weather Dashboard

A responsive weather dashboard that fetches live current weather and a 5-day forecast from the OpenWeatherMap public API.

## Features

- Search weather by city name
- Live current conditions
- 5-day forecast cards
- Responsive dashboard layout
- Clean dark-mode interface
- Works with a public weather API key

## Tech stack

- React
- Vite
- OpenWeatherMap API

## Getting started

1. Sign up for a free API key at https://openweathermap.org/api
2. Copy `.env.example` to `.env`
3. Replace `your_api_key_here` with your generated API key
4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

The app will run on http://localhost:3000 by default.

## Environment variables

Create a `.env` file in the project root with:

```bash
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

## Notes

This project demonstrates how to fetch weather data from a public API in a UI dashboard. The dashboard displays an error message if the API key is missing or if a city cannot be found.
