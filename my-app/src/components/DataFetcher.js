import React, {useState} from 'react';
import GridItem from './GridItem'
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

// register the necessary components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// variable to hold data for the chart
var shelterLabels;
var shelterDataPoints;

function DataFetcher({data}) {
    const [filterCapacity, setFilterCapacity] = useState(null)
    const [filterSector, setFilterSector] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedItem, setExpandedItem] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false) 

    // Handle displaying results after a filter button has been clicked
    const handleFilterChange = (capacity) => {
        setFilterCapacity(prev => prev === null ? capacity : null);
    }

    // Make the expanded div visible and set the state to true
    const expandItem = async(item) => {
        try{
            // fetch data from the api
            const response = await fetch(`https://shelter-backend.vercel.app/api/shelter/${item.id}`);
            if (!response.ok) {
                throw new Error('Data fetching failed');
            }
            // set the item to state
            setExpandedItem(item);
            setIsExpanded(true);

            // get the json data from the API
            const jsonData = await response.json();

            // set the variables to data from the api call 
            shelterLabels = jsonData.map(data => data.date_formatted);
            shelterDataPoints = jsonData.map(data => data.shelterInfo.unoccupied_beds);
            
        }
        catch(error){
            console.log("Error fetching this shelter's data", error);
        }
    };
    
    // Set the isExpanded state to false to close the expanded div 
    const closeItem = () => {
        setIsExpanded(false)
    }

    // Function to check if any field matches the search query
    const matchesSearch = (item) => {
        if (item == null) return false;
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.sector.toLowerCase().includes(query) ||
            item.address.toLowerCase().includes(query) ||
            item.org_name.toLowerCase().includes(query)
        );
    };


    // Extract unique sectors from the data
    const uniqueSectors = [...new Set(data.flatMap(item => item?.data?.map(shelter => shelter.sector) || []))].filter(Boolean);

    // Filter data based on unoccupied_beds and sector
    const filteredData = data.map(item => {
        if(!item) return null;
        return {
            ...item,
            data: item.data.filter(shelter => 
                (!filterCapacity || shelter.unoccupied_beds >= filterCapacity) &&
                (!filterSector || shelter.sector === filterSector) &&
                (!searchQuery || matchesSearch(shelter))
            )
        };
    }).filter(item => item.data && item.data.length > 0); // Remove entries without any matching shelters

    return (
        <div>
            <h2>List of Shelters</h2>
            <h3>Total Displayed: {filteredData.length > 0 ? Object.keys(filteredData[0].data).length : 0}</h3>
            <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                <Chip 
                    label="All Sectors" 
                    onClick={() => setFilterSector(null)} 
                    sx={{ backgroundColor: filterSector === null ? 'var(--accent-hover)' : 'var(--card-bg)', color: 'var(--text-primary)' }}
                    clickable
                />
                {uniqueSectors.map(sector => (
                    <Chip 
                        key={sector}
                        label={sector} 
                        onClick={() => setFilterSector(sector)} 
                        sx={{ backgroundColor: filterSector === sector ? 'var(--accent-hover)' : 'var(--card-bg)', color: 'var(--text-primary)' }}
                        clickable
                    />
                ))}
            </Box>
            <Stack spacing={2} sx={{maxWidth: 'md', mx: 'auto', marginBottom: '2rem'}}>
                <TextField 
                    sx={{backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', input: { color: 'var(--text-primary)' }}}
                    placeholder="Search for a Shelter" 
                    onChange={event => setSearchQuery(event.target.value)}
                    inputProps={{ 'aria-label': 'Search for a shelter by name, sector, or address' }}
                    InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'var(--text-secondary)' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '20px' }
                    }}
                />
                <Button 
                    variant="contained" 
                    onClick={() => handleFilterChange(1)}
                    aria-label={filterCapacity ? 'Show All Shelters' : 'Show only Available Beds'}
                    sx={{ backgroundColor: 'var(--accent-color)', borderRadius: '20px', '&:hover': { backgroundColor: 'var(--accent-hover)' } }}
                >
                    {filterCapacity ? 'Show All Shelters' : 'Show only Available Beds'}
                </Button>
            </Stack>
            {/* Get all the data and put inside a Grid */}
            <ul>
                {filteredData.map((entry, index) => (
                    <div>
                        <div className="container">
                            {entry.data.map((org, index) => (
                                <GridItem 
                                    key={index}
                                    name={org.name} 
                                    sector={org.sector} 
                                    address={org.address} 
                                    orgName={org.org_name} 
                                    unoccupiedBeds={org.unoccupied_beds}
                                    onClick={() => expandItem(org)}/>
                            ))}
                        </div>
                    </div>
                ))}
            </ul>
            {/* Conditional rendering of expanded card after clicking on a div*/}
            {isExpanded && expandedItem && (
                <>
                <div className="modal-overlay" onClick={closeItem} aria-hidden="true" />
                <div 
                    className="expanded-card" 
                    role="dialog" 
                    aria-labelledby="modal-title"
                    aria-modal="true"
                >
                    <h2 id="modal-title">{expandedItem.name}</h2>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CategoryIcon fontSize="small"/> <strong>Sector:</strong> {expandedItem.sector}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BusinessIcon fontSize="small"/> <strong>Organization Name:</strong> {expandedItem.org_name}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><LocationOnIcon fontSize="small"/> <strong>Address:</strong> {expandedItem.address}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BedIcon fontSize="small"/> <strong>Occupancy Rooms:</strong> {expandedItem.occupancy_rooms}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BedIcon fontSize="small"/> <strong>Occupancy Beds:</strong> {expandedItem.occupancy_beds}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BedIcon fontSize="small"/> <strong>Unoccupied Beds:</strong> {expandedItem.unoccupied_beds}</p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BedIcon fontSize="small"/> <strong>Unavailable Beds:</strong> {expandedItem.unavailable_beds}</p>
                    <div style={{width: '100%', height: '300px', marginTop: '1rem', marginBottom: '1rem'}}>
                        <Bar data={{
                            labels: shelterLabels,
                            datasets: [
                                {
                                    label: "Unoccupied Beds",
                                    data: shelterDataPoints,
                                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                    borderColor: 'rgb(59, 130, 246)',
                                    borderWidth: 1,
                                },
                            ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        ticks: {
                                            maxRotation: 90,
                                            minRotation: 90,
                                            color: '#94A3B8'
                                        },
                                        grid: { color: 'rgba(255,255,255,0.1)' }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        ticks: { color: '#94A3B8' },
                                        grid: { color: 'rgba(255,255,255,0.1)' }
                                    },
                                },
                                plugins: {
                                    legend: { labels: { color: '#F8FAFC' } }
                                }
                            }} 
                        />
                    </div>
                    <Button 
                        variant='contained' 
                        onClick={closeItem} 
                        aria-label="Close modal"
                        sx={{ backgroundColor: 'var(--accent-color)', '&:hover': { backgroundColor: 'var(--accent-hover)' } }}
                    >
                        Close
                    </Button>
                 </div>
                 </>
            )}
        </div>
    );
}

export default DataFetcher;