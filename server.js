'use strict'
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const PORT = process.env.PORT  ;
const DATABASE_URL = process.env.DATABASE_URL ;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY ;
const PARKS_API_KEY = process.env.PARKS_API_KEY ;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY ;
const YELP_API_KEY = process.env.YELP_API_KEY ;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY ;

const clint = new pg.Client(DATABASE_URL);

const app = express();

app.use(cors());

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);

app.get('*', notFound);

clint.connect().then(()=>{
    app.listen(PORT , ()=> {
    console.log(`its is a live ${PORT}`);
});
});


function getLocation(req , res){
   const city = req.query.city;
   const findCitySql = 'SELECT * FROM city WHERE search_query = $1;'
   const sqlArray = [city];

   const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&format=json&q=${city}&limit=1`;
   const quryParams = {
       key : GEOCODE_API_KEY,
       format : 'json',
       q : city,
       limit : 1
   }
   clint.query(findCitySql , sqlArray)
   .then((dataFromDB)=>{
       if(dataFromDB.rowCount === 0){
           superagent.get(url , quryParams).then(dataFromAPI =>{
           console.log('from API');
            const data = dataFromAPI.body[0];

            const city_location = new CityLocation (city,data.display_name, data.lat, data.lon);
            const insertCitySQL = 'INSERT INTO city (search_query , formatted_query, latitude, longitude) VALUES ($1 , $2 , $3, $4)'
            clint.query(insertCitySQL , [city,data.display_name, data.lat, data.lon])
            res.send(city_location);

           });
       }
       else{
           console.log('from Dabtbase')
       const data = dataFromDB.rows[0];
       const city_location = new CityLocation (city,data.formatted_query, data.latitude, data.longitude);
       res.send(city_location);

       }
   }).catch(internalserverError(res));


}


function getWeather(req , res){
    const city = req.query.search_query;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily` //?city=${city}&key=${WEATHER_API_KEY}`;
    const quryParams = {
        city,
        key:WEATHER_API_KEY,

    };
    // console.log(quryParams);
    superagent.get(url , quryParams).then(dataFromAPI=>{
        // console.log(dataFromAPI.body);
        const forecasts = dataFromAPI.body.data.map(data => new Forecast (data.weather.description));
    res.send(forecasts)
}).catch(internalserverError(res));
    
}
function getParks(req , res){
    const city = req.query.search_query;
    const url = `https://developer.nps.gov/api/v1/parks` //?city=${city}&key=${PARKS_API_KEY}`;
    const quryParams = {
        q :city,
        api_key:PARKS_API_KEY,

    };
    // console.log(quryParams);
    superagent.get(url , quryParams).then(dataFromAPI=>{
        // console.log(dataFromAPI.body);
        const address = dataFromAPI.body.data
        const parks = dataFromAPI.body.data.map(data => {
          const address = `${data.addresses[0].line1}, ${data.addresses[0].city} ,${data.addresses[0].state}`;
          return new Parks (data.fullName , data.address, data.entranceFees[0].cost, data.description, data.url)});
    res.send(parks)
}).catch(internalserverError(res));
}
function getMovies(req , res){
    const city = req.query.search_query;
    const url = `https://api.themoviedb.org/3/movie/top_rated` //?city=${city}&key=${PARKS_API_KEY}`;
    const quryParams = {
        query :city,
        api_key:MOVIE_API_KEY,

    };
    // console.log(quryParams);
    superagent.get(url , quryParams).then(dataFromAPI=>{
    const movies = dataFromAPI.body.results.map(data => new Movies (data));
    res.send(movies);
}).catch(internalserverError(res));
}
let fi= 0;

function getYelp(req , res){
    const city = req.query.search_query;
    const url = `https://api.yelp.com/v3/businesses/search` //?city=${city}&key=${PARKS_API_KEY}`;
    const quryParams = {
        location :city,
        term : 'restaurants'

    };
    // console.log(quryParams);
    superagent.get(url , quryParams).set('Authorization', `Bearer ${YELP_API_KEY}`).then(dataFromAPI=>{
       const restaurants = dataFromAPI.body.businesses.map(data => new Restaurant(data));
       let ei= fi+5;
       let pag = restaurants.slice(fi, ei);
       fi+=5;
    res.send(pag);
    }).catch(internalserverError(res));
}
function CityLocation (search_query ,formatted_query, latitude , longitude){
    this.search_query = search_query;
    this.formatted_query = formatted_query;
    this.latitude = latitude;
    this.longitude = longitude;
}

function Forecast(forecast , time){
this.forecast = forecast;
this.time = time;
}


function Parks(name , address, fee, description,url){
    this.name = name;
    this.address= address
    this.fee= fee;
    this.description = description;
    this.url=url;
}

function Restaurant(data){
    this.name =data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url= data.url;
           
}

function Movies(data){
    
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.votes_average;
  this.total_votes = data.votes_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.released_date;
     
}



//Error Handler 
function notFound(req, res){
    res.status(404).send('Not Found');

}

function internalserverError(res){
    return (error)=>{
        console.log(error);
        res.status(500).send('somthing Went wrong');
    }
}