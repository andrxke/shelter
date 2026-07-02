import React from 'react';

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
      <h3>{sector}</h3>
      <h3>{orgName}</h3>
      <p>{address}</p>
      <p style={{ color: getBedColor(unoccupiedBeds), marginTop: '0.5rem' }}>
        Beds: {unoccupiedBeds === "" ? "No Data" : unoccupiedBeds}
      </p>
    </div>
  );
};

export default GridItem;