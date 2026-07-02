# Toronto Shelter System Map

A full-stack web application that displays information on shelters within Toronto's Shelter System.

## Features
- Interactive map showing all shelters in Toronto.
- Displays the occupancy rate and available beds for each shelter.
- Shows targeted service groups and programs for different shelters.

## Architecture
- **Frontend (`/my-app`)**: React application that renders the interactive map and UI.
- **Backend Pipeline (`get_data.py`)**: Python script that fetches daily shelter overnight service occupancy capacity from the City of Toronto Open Data API (CKAN). It cleans and processes the data using Pandas, and stores it in a MongoDB database for the frontend to consume.

## Technologies Used
- **Frontend**: React.js
- **Data Pipeline**: Python, Pandas, Requests
- **Database**: MongoDB
- **Data Source**: [City of Toronto Open Data Portal](https://open.toronto.ca/)

## Future Roadmap
- Pull occupancy data from the past 7 days to display historical trends.
