import React from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';

const GridItem = ({ name, sector, orgName, address, unoccupiedBeds, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const getBedColor = (beds) => {
    if (beds === "" || beds === null || beds === "No Data") return "var(--text-secondary)";
    return beds < 10 ? "var(--danger)" : "var(--success)";
  };

  return (
    <div 
      className="card" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Shelter: ${name}, ${sector} sector. ${unoccupiedBeds} beds available.`}
    >
      <h2>{name}</h2>
      <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CategoryIcon fontSize="small"/> {sector}</h3>
      <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BusinessIcon fontSize="small"/> {orgName}</h3>
      <p style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><LocationOnIcon fontSize="small"/> {address}</p>
      <p style={{ color: getBedColor(unoccupiedBeds), marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BedIcon fontSize="small"/> Beds: {unoccupiedBeds === "" ? "No Data" : unoccupiedBeds}
      </p>
    </div>
  );
};

export default GridItem;