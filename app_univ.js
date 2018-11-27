// CS360 project#2 tutorial
// author: smhan@dbserver.kaist.ac.kr

var mysql = require('mysql'); // MySQL module on node.js

var connection = mysql.createConnection({
    host     : 'localhost',
    port     : 3306,
    user     : 'tester',
    password : '1234',
    database : 'cs360_hoep',
});

connection.connect(); // Connection to MySQL

var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use('/', express.static(__dirname));
app.use('/', express.static(__dirname + '/public')); // you may put public js, css, html files if you want...
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var queryStr = ""
var updateStr = ""

// "node app.js" running on port 3000
app.listen(8000, function () {
	console.log('Example app listening on port 8000!');
});



// base url action: "http://localhost/" -> send "index.html" file.
app.get('/', function (req, res) {
	res.sendFile(__dirname + "/homepage.html");
});


// get action to give raw data for user_tbl: "http://localhost/listAPI"
app.post('/univ_search', function (req, res) {
	console.log(req.body); // log to the node.js server (CMD console에 이미지 띄우기 )

	// [수정 가능] "user_dept"와 "user_region"에 아무런 값을 입력하지 않는 경우 에러 띄우기
	// res.sendFile로 새로운 페이지에 alert_box.html을 띄우는 것으로 구현했는데, 애초에 POST 액션 전에 메인 페이지에서 뜨게 하는 방법이 있으면 수정하기
	if (req.body.user_dept == 0 || typeof req.body.user_region == "undefined"){
		res.sendFile(__dirname + "/alert_box.html");
		return
	}

	// Construct queryStr
	queryStr =
	'SELECT A.Name as Univ_name, B.Univ_track as Dept, A.Region, A.Language_id, A.Available_number FROM UNIVERSITY AS A INNER JOIN (SELECT UID, Univ_track FROM REQUEST1 WHERE DID = "' + req.body.user_dept + '" AND RID '

	// Case 1. Multiple regions selected by user
	if(req.body.user_region.length > 1){
		var region_str_set = "("
		var index = 1

		for(index = 1; index < req.body.user_region.length; index++){
			region_str_set = region_str_set.concat(req.body.user_region[index], ',')
		}
		// Replace last character ',' with ')' ()
		// https://stackoverflow.com/questions/36630230/replace-last-character-of-string-using-javascript
		var region_str_set = region_str_set.replace(/.$/,")")

		queryStr = queryStr.concat("IN ", region_str_set)

	// Case 2. Only one region selected by user
	}else{
		queryStr = queryStr.concat('= ', req.body.user_region[0])
	}

	queryStr = queryStr + ') AS B USING(UID) WHERE Undergraduate = 1;'
	res.sendFile(__dirname + "/result.html");
});


app.get('/listAPI', function (req, res) {
	connection.query(queryStr, function (err, rows) {
		if (err) throw err;
		res.send(rows);
	})
});


// 2. REVIEW : SEARCH
app.post('/review_search', function(req, res){
	console.log(req.body); // log to the node.js server
	queryStr = "SELECT Univ_name, Name, URL FROM FORMER_EXCHANGE WHERE Univ_name LIKE '%"
		+ req.body.univ+ "%';"
	res.sendFile(__dirname + "/review_search_result.html");
});

app.get('/review_search_API',function(req, res){
	console.log(req.body);
	connection.query(queryStr, function (err, rows) {
			if (err) throw err;
			res.send(rows);
	});
});

// 2. REVIEW : INSERT
app.post('/review_insert', function(req, res){
	console.log(req.body); // log to the node.js server
	queryStr = "SELECT Name FROM UNIVERSITY WHERE Name LIKE %"+req.body.univ+"%";
	updateStr = "INSERT INTO FORMER_EXCHANGE VALUES ("+req.body.name+", "+req.body.author+", "+req.body.URL+")";
	res.sendFile(__dirname + "/review_search_result.html");
});

app.get('/review_insert_API',function(req, res){
	connection.query(queryStr, function (err, rows) {
			if (err) throw err;
			if (length(rows) != 1) throw err;
	});
	conection.query(updateStr, function (err, result) {
    	if (err) throw err;
    	console.log("1 record inserted");
  	});
});


function openTab(evt, section) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(section).style.display = "block";
    evt.currentTarget.className += " active";
}
