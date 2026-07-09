const dotenv=require('dotenv');
dotenv.config({
    path:'./.env' 
});
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}...!`));

const database = mongoose.connection

database.on('error', (error) => {
  console.log(error)
})

database.once('connected', () => {
  console.log('Database Connected');
})

// Enable cors
const cors = require('cors');
app.use(cors());

// Define a Mongoose Schema
const schema = new mongoose.Schema({
  date: Date,
  data: Array 
}, { collection: 'shelterdata' })

const MyModel = mongoose.model('shelterdata', schema)

// Route handler
app.get('/hello', async (req,res) =>{
  try{
    res.send([{ "name": "Test", "address":"test"}]);
  } catch(error){
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

// default route
app.get("/", (req, res) => res.send("Express on Vercel"));

// return the most recent data entry
app.get('/api/data', async (req,res) =>{
  try{
    const data = await MyModel.find({}, {date: 1, data: 1}).limit(1).sort({_id:-1})
    res.json(data)
    console.log('sent!')
  } catch(error){
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  
})

// return data from the past 7 days 
app.get('/api/shelter/:shelterId', async (req, res) => {
  const { shelterId } = req.params;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const data = await MyModel.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo },
          'data.id': parseInt(shelterId)
        }
      },
      {
        $unwind: "$data"
      },
      {
        $match: {
          'data.id': parseInt(shelterId)
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          date_formatted: "$date_formatted",
          shelterInfo: "$data"
        }
      },
      {
        $group: {
          _id: null,
          shelters: {
            $push: {
              date: "$date",
              date_formatted: "$date_formatted",
              shelterInfo: "$shelterInfo"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          shelters: 1
        }
      }
    ]);

    res.json(data.length ? data[0].shelters : []);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

