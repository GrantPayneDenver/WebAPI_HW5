var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var async = require('async');

var app = express();
//app.use(express.bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));

//ERROR HANDLING
app.put('/movies', function(req,res){
  res.status(400).json({"status" : "400", "description" : "You can not PUT to /movies. Use /movies/<name> to specify a movie you're PUTing."});
});
// Desribes the use of the Proxy
app.get('/', function(req, res){
  res.send('Movies and Reviews DB<br>You can use GET and POST on /movies, and if you have /movies/taxi driver?reviews=true, for example, you can get / post the review of a movie as well. <br> to POST a review, you must make query string like so: http://granters-test.apigee.net/HW5/movies?reviews=true&movie=bee movie <br> otherwise to just POST a movie, just have it end at /HW5/movies, and have the movie body in the body field');
});

app.post('/', function(req,res){
  res.status(400).send({"status" : "400", "description" : "You can not send a POST here, use GET for more info."});
});
app.put('/', function(req,res){
  res.status(400).send({"status" : "400", "description" : "You can not send a PUT here, use GET for more info"});
});
app.delete('/', function(req, res){
  res.status(400).send({"status" : "400", "description" : "You can not send a DELETE here, use GET for more info"});
});
//ERROR HANDLING END

// grabbing all movies
app.get('/movies', function(req, res){
  var rtrn = "";
  var rqst = 'https://apibaas-trial.apigee.net/granters/sandbox/movies';
  request({
    url: rqst,
    method: 'GET',
    json: true
  }, function(error, response, body){
    if(error) {
      console.log(error);
    } else {
      if(body.error){
        res.status(400).json(body)
      }else{
        for (var i = 0 ; i < body.entities.length ; i++){
          delete body.entities[i].uuid;
          delete body.entities[i].type;
          delete body.entities[i].metadata;
          delete body.entities[i].created;
          delete body.entities[i].modified;
        }
      }
      var responseBody = {};
      responseBody.status = "200";
      responseBody.description = "GET for all movies worked";
      responseBody.movies = body.entities;
      res.json(responseBody);
    }
  });
});

// grabbing particular movie
// example call: http://granters-test.apigee.net/HW4/movies/Training Day
app.get('/movies/:name', function(req, res){
  var rqst = 'https://apibaas-trial.apigee.net/granters/sandbox/movies/' + req.params.name;
  var rqst2 = "https://apibaas-trial.apigee.net/granters/sandbox/reviews?ql=movie='" + req.params.name + "'";

  // if(get_review === "true") know to get movie reviews
  var get_review = req.query.reviews;

  if(get_review === 'true'){

    async.parallel
    ([
      function getMovie(callback)
      {

        var responseBody = {};
        request({
          url: rqst,
          method: 'GET',
          json: true
        }, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            if(body.error){
              callback({"status" : "400", "description" : "Movie not found, yo!:( "}, responseBody);
              //res.status(400).json({"status" : "400", "description" : "Movie not found, yo!:( "});
              return false;
            }else{


              responseBody.status = "200";
              responseBody.description = "GET for one movie worked!";
              responseBody.name = body.entities[0].name;
              responseBody.releaseDate = body.entities[0].releaseDate;
              responseBody.actors = body.entities[0].actors;

              callback(null, responseBody);
            }
          }
        });

      }, // getMovie
      function getReview(callback) {

        var responseBody = {};
        responseBody.revs = [];
        request({
          url: rqst2,
          method: 'GET',
          json: true
        }, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            if(body.error){
              callback({"status" : "400", "description" : "Movie review not found, yo!:( "}, responseBody);
            }else{

              for (var i = 0 ; i < body.entities.length ; i++){
                responseBody.revs[i] = {
                  "reviewer" : body.entities[i].reviewer,
                  "review" : body.entities[i].review,
                  "rating" : body.entities[i].rating
                };
              }
              callback(null, responseBody);
            }
          }
        });


      } // functionTwo
    ], function(err, result) {
      if(err){
        res.status(400).json({"status" : "400", "description" : "Movie not found, yo!:( "});
      }else{
        res.send({movie:result[0], review:result[1]});
      }

    }) // async para
  }
  else{
    // request( {request body items}, function( ) )
    request({
      url: rqst,
      method: 'GET',
      json: true
    }, function(error, response, body){
      if(error) {
        console.log(error);
      } else {
        if(body.error){
          res.status(400).json({"status" : "400", "description" : "Movie not found, yo!:( "});
        }else{
          var responseBody = {};

          responseBody.status = "200";
          responseBody.description = "GET for one movie worked!!!!";
          responseBody.name = body.entities[0].name;
          responseBody.releaseDate = body.entities[0].releaseDate;
          responseBody.actors = body.entities[0].actors;


          res.json(responseBody);
        }
      }
    }/*,function () {}*/)/*request()*/;
  }

}); //app.get

app.post('/movies', jsonParser, function(req, res){
  var post_review = req.query.reviews;
  if(post_review === 'true'){
    async.parallel
    ([
      function findMovie(callback)
      {
        var responseBody = {};
        request({
          url: 'https://apibaas-trial.apigee.net/granters/sandbox/movies',
          method: 'GET',
          json: true
        }, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            if(body.error){
              callback({"status" : "400", "description" : "Movie not found, can't post review:( "}, responseBody);
              // res.status(400).json({"status" : "400", "description" : "Movie not found, yo!:( "});
              return false;
            }else{
              callback(null, responseBody);
            }
          }
        });

      }
    ], function(err, result) {
      if(err){
        var msg = err.message
        res.status(400).json({"status" : "400", "description" : "Movie not found, yo!:( ", "msg": msg});
      }else{
        // post to reviews
        if (req.body.name == undefined || req.body.review == undefined || req.body.reviewer == undefined ||  req.body.rating === undefined){
          res.status(400).send({"status" : "400", "description" : "Error. Need movie name, rating, review, and reviewer in JSON body."});
        } else {
          request({
            url: 'https://apibaas-trial.apigee.net/granters/sandbox/reviews',
            method: 'POST',
            json: true,
            body: {
              "movie" : req.body.name,
              "rating" : req.body.releaseDate,
              "review": req.body.actors,
              "reviewer" : req.body.reviewe
            }
          }, function(error, response, body){
            if(error) {
              console.log(error);
            } else {
              if (body.error){
                res.status(400).json({"status" : "400", "description" : "review post failed"});
              }else{
                var responseBody = {};
                responseBody.status = "200";
                responseBody.description = "Successfully POSTed a review";
                responseBody.name = body.entities[0].movie;
                responseBody.review = body.entities[0].review;
                responseBody.rating = body.entities[0].rating;
                res.json(responseBody);
              }
            }
          });
        }

      }
    }) // async para

  } // if review = true, post rev, end
  else{
    if (req.body.name == undefined || req.body.releaseDate == undefined || req.body.actors == undefined){
      res.status(400).send({"status" : "400", "description" : "Error. Need name, releaseDate, and actors[] in JSON body."});
    } else {
      request({
        url: 'https://apibaas-trial.apigee.net/granters/sandbox/movies' ,
        method: 'POST',
        json: true,
        body: {
          "name" : req.body.name,
          "releaseDate" : req.body.releaseDate,
          "actors": req.body.actors
        }
      }, function(error, response, body){
        if(error) {
          console.log(error);
        } else {
          if (body.error){
            res.status(400).json({"status" : "400", "description" : "duplicate movie error"});
          }else{
            var responseBody = {};
            responseBody.status = "200";
            responseBody.description = "Successfully POSTed a movie";
            responseBody.name = body.entities[0].name;
            responseBody.releaseDate = body.entities[0].releaseDate;
            responseBody.actors = body.entities[0].actors;
            res.json(responseBody);
          }
        }
      });
    }
  } // else just posting movie


}); // app.post


app.delete('/movies', function(req, res){
  res.status(400).json({"status" : "400", "description" : "ERROR don't delete all movies"});
});

app.delete('/movies/:name', function(req,res){
  var rqst = 'https://apibaas-trial.apigee.net/granters/sandbox/movies/' + req.params.name;
  request({
    url: rqst,
    method: 'DELETE',
    json: true,
  }, function(error, response, body){
    if(error) {
      console.log(error);
    } else {
      if(body.error){
        res.status(400).json({"status" : "400", "description" : "Movie is not in the database, cannot delete"});
      }else{
        var responseBody = {};
        responseBody.status = "200";
        responseBody.description = "delete successful";
        responseBody.name = body.entities[0].name;
        responseBody.releaseDate = body.entities[0].releaseDate;
        responseBody.actors = body.entities[0].actors;
        res.json(responseBody);
      }
    }
  });
});


// Listen for requests until the server is stopped

app.listen(process.env.PORT || 9000);
console.log('The server is running!');