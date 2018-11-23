// CS360 project#2 tutorial
// author: smhan@dbserver.kaist.ac.kr

var mysql = require('mysql'); // MySQL module on node.js

var connection = mysql.createConnection({
    host     : 'localhost',
    port     : 3306,
    user     : 'tester',
    password : '1234',
    database : 'cs360_tutorial',
});

connection.connect(); // Connection to MySQL

var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use('/', express.static(__dirname + '/public')); // you may put public js, css, html files if you want...
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 



// "node app.js" running on port 3000
app.listen(8000, function () {
	console.log('Example app listening on port 8000!');
});



// base url action: "http://localhost/" -> send "index.html" file.
app.get('/', function (req, res) {
	res.sendFile(__dirname + "/homepage.html");
});



// get action to give raw data for user_tbl: "http://localhost/listAPI"
app.post('/inital_search', function (req, res) {
	console.log(req.body); // log to the node.js server
	
	queryStr = 'select * from user_tbl where id = '
		+ req.body.user_region[0] + ';';
	
	connection.query(queryStr, function (err, rows) {
		if (err) throw err;
		console.log(rows);
		res.send(rows);
	})
});	
