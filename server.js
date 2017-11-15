var express = require ('express'),
	app = express(),
	port = process.env.PORT || 80;

var bodyParser = require('body-parser');
var path = require('path');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', function(req,res){
	res.sendFile(path.join(__dirname + 'public/index.html'));
});

app.listen(port);

console.log('Swoboda Lights running on : ' + port);