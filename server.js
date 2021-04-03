'use strict'
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const PORT = process.env.PORT || 3000 ;
const app = express();

app.use(cors());

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);

app.get('*', notFound);

app.listen(PORT , ()=> {
    console.log(`its is a live ${PORT}`);
})

function getLocation(req , res){
    res.send(
        
            {
                "search_query": "seattle",
                "formatted_query": "Seattle, WA, USA",
                "latitude": "47.606210",
                "longitude": "-122.332071"
              }
        
    )
}

function getWeather(req , res){
    res.send(
        
            {
                "search_query": "seattle",
                "formatted_query": "Seattle, WA, USA",
                "latitude": "47.606210",
                "longitude": "-122.332071"
              }
        
    )
}
function getParks(req , res){
    res.send(
        
            {
                "search_query": "seattle",
                "formatted_query": "Seattle, WA, USA",
                "latitude": "47.606210",
                "longitude": "-122.332071"
              }
        
    )
}
function getMovies(req , res){
    res.send(
        
            {
                "search_query": "seattle",
                "formatted_query": "Seattle, WA, USA",
                "latitude": "47.606210",
                "longitude": "-122.332071"
              }
        
    )
}
function getYelp(req , res){
    res.send(
        
            {
                "search_query": "seattle",
                "formatted_query": "Seattle, WA, USA",
                "latitude": "47.606210",
                "longitude": "-122.332071"
              }
        
    )
}
function notFound(req, res){
    res.status(404).send('Not Found');

}