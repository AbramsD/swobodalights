var express = require ('express'),
	app = express(),
	port = process.env.PORT || 3000,
	passport = require('passport'),
	FacebookTokenStrategy = require('passport-facebook-token'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	fppAddress = process.env.SHOWURL,
	fetch = require('node-fetch'),
	xml2js = require('xml2js-es6-promise'),
	station = process.env.FMSTATION;;




var bodyParser = require('body-parser');
var path = require('path');

var shows = require('./Shows.json');
var last_launch = {};

passport.use(new FacebookTokenStrategy({
		clientID: process.env.CLIENTID,
		clientSecret: process.env.CLIENT_SECRET
	},
	function(accessToken, refreshToken, profile, done){
		var user = {
        'email': profile.emails[0].value,
        'name' : profile.name.givenName + ' ' + profile.name.familyName,
        'id'   : profile.id,
        'token': accessToken
    }
		return done(null,user);
	}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));


app.get('/', function(req,res){
		res.sendFile(path.join(__dirname + '/public/old_index.html'));
	});


app.get('/login/facebook/return',
	passport.authenticate('facebook-token', {failureRedirect: '/login'}),
	function(req, res){
		res.redirect('/');
	});


app.get('/launchboard',
	passport.authenticate("facebook-token"),
	function(req,res){
		if (req.user){
			res.render("launchboard", shows);
		} else {
			res.send(404);
		}
	});

app.get('/startShow', 
	passport.authenticate("facebook-token"),
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
				console.log(statusObj)
				if(statusObj.Status.fppStatus[0] == "0" ){
					console.log("Status 0")
					res.status(200);
					res.render("out_of_schedule")
				} else if(statusObj.Status.fppStatus[0] == "1"){
					//console.log("status 1")
					var currentPlayList = statusObj.Status.CurrentPlaylist[0];
					console.log("currentPlaylist: " + currentPlayList);
					if(currentPlayList != "Daily_Playlist"){
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
	passport.authenticate("facebook-token"),
	function(req,res){
		var station = process.env.FMSTATION;
		res.render("thanks", {station: station});
	});

app.get('/sorry',
	passport.authenticate("facebook-token"),
	function(req,res){
		res.render("technical_difficulties");
	});


app.get('/logout', function(req,res){
	req.logout();
	res.redirect('/');
});

app.listen(port);

console.log('Swoboda Lights running on : ' + port);