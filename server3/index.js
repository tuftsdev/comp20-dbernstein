// Initialization
var express = require('express');

// Required if we need to use HTTP query or post parameters
var bodyParser = require('body-parser');
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js
var app = express();
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

// Mongo initialization and connect to database
// process.env.MONGOLAB_URI is the environment variable on Heroku for the MongoLab add-on
// process.env.MONGOHQ_URL is the environment variable on Heroku for the MongoHQ add-on
// If environment variables not found, fall back to mongodb://localhost/nodemongoexample
// nodemongoexample is the name of the database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/server3';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
        db = databaseConnection;
});

// Serve static content
app.use(express.static(__dirname + '/public'));

app.post('/sendLocation', function(request, response) {
        var login = request.body.login;
        var lat = request.body.lat;
        var lng = request.body.lng;
        var created_at = Date();

        console.log(login);
        console.log(lat);
        console.log(lng);

        var checkIn = {
                "login"     : login,
                "lat"       : lat,
                "lng"       : lng,
                "created_at": created_at
        }
        //db.collection('landmarks').createIndex({'geometry':"2dsphere"}, callback_function);

        db.collection('checkins', function(error, coll) {
                var id = coll.insert(checkIn, function(error, saved) {
                        if (error) {
                                response.send(500);
                        }
                        else {
                                response.send(200);
                        }
            });
        });
});

app.get('/checkins.json', function(request, response) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        
        var login = request.query.login;

        if(!login) {
            response.send([]);
            return;
        }

        var toFind = {"login": login};

        db.collection('checkins', function(error, coll) {
                coll.find(toFind).toArray(function(err, cursor) {
                        if (!err) {
                                response.send(cursor);
                        } else {
                                console.log("error");
                        }
                });
        });
});

app.get('/', function(request, response) {
        response.set('Content-Type', 'text/html');
        var indexPage = '';
        db.collection('fooditems', function(er, collection) {
                collection.find().toArray(function(err, cursor) {
                        if (!err) {
                                indexPage += "<!DOCTYPE HTML><html><head><title>What Did You Feed Me?</title></head><body><h1>What Did You Feed Me?</h1>";
                                for (var count = 0; count < cursor.length; count++) {
                                        indexPage += "<p>You fed me " + cursor[count].food + "!</p>";
                                }
                                indexPage += "</body></html>"
                                response.send(indexPage);
                        } else {
                                response.send('<!DOCTYPE HTML><html><head><title>What Did You Feed Me?</title></head><body><h1>Whoops, something went terribly wrong!</h1></body></html>');
                        }
                });
        });
});

// Oh joy! http://stackoverflow.com/questions/15693192/heroku-node-js-error-web-process-failed-to-bind-to-port-within-60-seconds-of
app.listen(process.env.PORT || 3000);
