import React, {useState, useEffect} from 'react';
import './App.css';
import DataFetcher from './components/DataFetcher'
import Map from './components/Map'

// Map Imports
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX;

function App() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://shelter-backend.vercel.app/api/data');
        if (!response.ok) {
          throw new Error('Data fetching failed');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <h1>
        Shelter.
      </h1>
      {data.length > 0 ? <Map data={data} /> : <div>Loading map data...</div>}
      <header className="App-header"> 
        <DataFetcher data={data}/>
      </header>
    </div>
  );
}

export default App;
