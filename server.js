var express = require ('express'),
	app = express(),
	port = process.env.PORT || 3000,
	fppAddress = process.env.SHOWURL,
	fetch = require('node-fetch'),
	xml2js = require('xml2js-es6-promise'),
	rateLimit = require("express-rate-limit"),
	station = process.env.FMSTATION;;




var bodyParser = require('body-parser');
var path = require('path');

var shows = require('./Shows.json');
var last_launch = {};

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30 // limit each IP to 100 requests per windowMs
});


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(limiter);
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));


app.get('/', function(req,res){
		res.sendFile(path.join(__dirname + '/public/old_index.html'));
	});


app.get('/launchboard',
	function(req,res){
		res.render("launchboard", shows);
	});

app.get('/startShow', 
	function(req,res, next){
		//console.log("In Start Show")
		//Check if the system is up.
		//console.log(fppAddress);
		var status;
		var url = fppAddress + "/fppxml.php?command=getFPPstatus"
		fetch(url)
			.then(function(response){
				if(response.status != 200){
					res.status(500);
					res.send("Unable to contact light controller.");
					//console.log("Non 200 response");
					//Email Jared
				} else {
					return response.text();
				}

			}).then(function(body){  //Convert the xml to an object
				return xml2js(body);
			}).then(function (statusObj){ //Evaluate the system status
				
				if(statusObj.Status.fppStatus[0] == "0" ){
					res.status(200);
					res.render("out_of_schedule")
				} else if(statusObj.Status.fppStatus[0] == "1"){
					//console.log("status 1")
					var currentPlayList = statusObj.Status.CurrentPlaylist[0];
					console.log("currentPlaylist: " + currentPlayList);
					if(currentPlayList != "DailyPlaylist"){
						// console.log ("In Not Daily Playlist")
						res.status(200);
						res.render("sorry_already_running", {station: station, playlist: currentPlayList});
					}else{
						// console.log("In Daily_Playlist");
						var show_id = req.query.showId;

						var lastRunTime = last_launch[show_id]
						// console.log("Last Run: " + lastRunTime);
						if(lastRunTime){
							var timeDiff = Date.now() - lastRunTime;
							if (timeDiff < 600000){
								var resetTime = Math.ceil((600000 - timeDiff) / 60000)
								//Shows been run in the last 10 minutes
								res.status(200);
								res.render("sorry_run_too_much", {showsresettime : resetTime})
								return;
							}
						}

						//console.log("able to launch show.")
						
						var url = fppAddress + "/fppxml.php?command=triggerEvent&id=" + show_id;
						//console.log("Stating Show Id:" + show_id)
						//console.log("URL: " + url)
						return fetch(url);
					}

				}
			}).then(function(response){
				if(response){
					//console.log("In Start Show fetch response")
					//console.log("startshow status:" + response);
					if(response.status == 200){
						last_launch[req.query.showId] = Date.now();
						res.status(200);
						res.render("thanks", {station: station});
					}else {
						//ping Jared
						res.status(200)
						res.render("unable_to_launch")
					}
				}
			}).catch(next);
			
	});

app.get('/thanks',
	function(req,res){
		var station = process.env.FMSTATION;
		res.render("thanks", {station: station});
	});

app.get('/sorry',
	function(req,res){
		res.render("technical_difficulties");
	});


app.listen(port);

console.log('Swoboda Lights running on : ' + port);