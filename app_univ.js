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
	res.sendFile(__dirname + "/HTML/homepage.html");
});


// Function 1. University Search - Search for foreign university using user's department and univ region
// get action to give raw data for user_tbl: "http://localhost/listAPI"
app.post('/univ_search', function (req, res) {
	console.log(req.body); // log to the node.js server (CMD console에 이미지 띄우기 )

	// [수정 가능] "user_dept"와 "user_region"에 아무런 값을 입력하지 않는 경우 에러 띄우기
	// res.sendFile로 새로운 페이지에 alert_box.html을 띄우는 것으로 구현했는데, 애초에 POST 액션 전에 메인 페이지에서 뜨게 하는 방법이 있으면 수정하기
	if (req.body.user_dept == 0 || typeof req.body.user_region == "undefined"){
		res.sendFile(__dirname + "/HTML/alert_box.html");
		return
	}

	// Construct queryStr
	// Step 1. RID를 이용해 TRACK_N_UNIV를 REGION과 JOIN 한 후, 각 track에 대해 KAIST scholarship 액수를 retrieve한다.
	// Step 2. TRACK_N_UNIV 에서, user의 학과와 동일한 학과의 track이 존재하는 해외 대학의 UID를 추출한다.
	// Step 3. 추출한 UID를 바탕으로, UNIVERSITY와 JOIN 하여, 해당되는 대학에 대한 정보와 해외 대학 학과명을 출력한다.
	queryStr =
	'SELECT A.Name as Univ_name, B.Univ_track as Dept, A.Country_id, A.Language_id, A.Available_number, B.Scholarship FROM UNIVERSITY AS A INNER JOIN (SELECT TRACK_N_UNIV.UID as UID, TRACK_N_UNIV.Univ_track as Univ_track, REGION.KAIST_scholarship as Scholarship FROM (TRACK_N_UNIV INNER JOIN REGION USING (RID))'

	updateStr = 'WHERE DID = ' + req.body.user_dept + ' AND RID '

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

		updateStr = updateStr.concat("IN ", region_str_set)

	// Case 2. Only one region selected by user
	}else{
		updateStr = updateStr.concat('= ', req.body.user_region[0])
	}

	// console.log(updateStr)

	queryStr = queryStr.concat(updateStr, ') AS B USING(UID) WHERE Undergraduate = 1;');

	//console.log(queryStr)

	res.sendFile(__dirname + "/HTML/result.html");
});

// Fill in result.html with records acquired from DB using 'queryStr'
app.get('/listAPI', function (req, res) {
	connection.query(queryStr, function (err, rows) {
		if (err) throw err;
		res.send(rows);
	})
});

app.get('/univ_num', function (req, res) {
	connection.query("SELECT COUNT(*) AS Count FROM TRACK_N_UNIV " + updateStr, function (err, rows) {
		if (err) throw err;
		res.send(rows);
	})
});

// Function 1-2. LANGUAGE_CERTIFICATE SEARCH - Search for language prerequisite of target university
app.post('/lang_search', function(req,res){
	console.log(req.body);
	queryStr = "SELECT A.Name, Type, B.Language_id as Language, Requisite FROM (UNIVERSITY AS A INNER JOIN LANGUAGE_CERTIFICATE AS B USING (UID)) WHERE A.Name LIKE '%"
		+ req.body.univ + "%';"
	res.sendFile(__dirname + "/HTML/lang_search_result.html");
});

app.get('/lang_search_API',function(req, res){
	connection.query(queryStr, function (err, rows) {
		if (err) throw err;
		res.send(rows);
	});
});

// Function 2-1. REVIEW SEARCH - Search for reviews written by other students using university name
app.post('/review_search', function(req, res){
	console.log(req.body); // log to the node.js server
	queryStr = "SELECT Univ_name, Name, URL FROM FORMER_EXCHANGE WHERE Univ_name LIKE '%"
		+ req.body.univ+ "%';"
	res.sendFile(__dirname + "/HTML/review_search_result.html");
});

app.get('/review_search_API',function(req, res){
	connection.query(queryStr, function (err, rows) {
			if (err) throw err;
			res.send(rows);
	});
});


// Function 2-2. REVIEW INSERT - Insert new reviews
app.post('/review_insert', function(req, res){
	console.log(req.body); // log to the node.js server
	queryStr = "SELECT UID, Name FROM UNIVERSITY WHERE Name LIKE '%"+req.body.univ+"%'";
	var uid;
	var univName;
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	if(dd<10) dd = '0'+dd;
	if(mm<10) mm = '0'+mm;
	today = yyyy + '-' + mm + '-' + dd;
	console.log(today)
	connection.query(queryStr, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length != 1) {
			res.sendFile(__dirname + "/HTML/alert_box.html");
			return
		}
		console.log(rows);
		uid = rows[0].UID;
		univName = rows[0].Name;
		console.log(uid)
		console.log(univName)

		// INSERT to FORMER_EXCHANGE with selected values
		connection.query("SELECT * FROM FORMER_EXCHANGE WHERE UID="+uid+" AND Name='"+req.body.author+"';", function(err, rows){
			if(err) throw err;
			console.log(rows)
			if (Object.keys(rows).length >= 1){
				res.sendFile(__dirname + "/HTML/alert_box.html");
				return
			}
			updateStr = "INSERT INTO FORMER_EXCHANGE VALUES ("+uid +", '"+univName+"', '"+req.body.author+"', '"+
	today+"', '"+req.body.URL+"')";
			console.log(updateStr);
			connection.query(updateStr, function (err, rows) {
				console.log(rows);
		    	if (err) throw err;
				console.log(rows); // log to check MySQL update result
				res.sendFile(__dirname + "/HTML/success_box.html");  // Put success box on page
				return
		  	});
		});

	});
});

// Function 2-3. REVIEW DELETE - Insert new reviews
app.post('/review_delete', function(req, res){
	console.log(req.body); // log to the node.js server
	queryStr = "SELECT UID, Name FROM UNIVERSITY WHERE Name LIKE '%"+req.body.univ+"%'";
	connection.query(queryStr, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length != 1) {
			res.sendFile(__dirname + "/HTML/alert_box.html");
			return
		}
		console.log(rows);
		uid = rows[0].UID;
		univName = rows[0].Name;
		console.log(uid)
		console.log(univName)
		connection.query("SELECT * FROM FORMER_EXCHANGE WHERE UID='"+uid+"' AND Name='"+req.body.author+"';", function(err, rows){
			if(err) throw err;
			console.log(rows)
			if (Object.keys(rows).length == 0){
				res.sendFile(__dirname + "/HTML/alert_box.html");
				return
			}
			updateStr = "DELETE FROM FORMER_EXCHANGE WHERE UID = '"+uid+"' and Name = '"+req.body.author+"';"
			console.log(updateStr);
			connection.query(updateStr, function (err, rows) {
				console.log(rows);
		    	if (err) throw err;
				console.log(rows); // log to check MySQL update result
				res.sendFile(__dirname + "/HTML/success_box.html");  // Put success box on page
				return
			});
		});
	});
});


// Function 3-1. IO Coordinator + Region in charge - Show regions for program and each IO coordinators in charge of each region
app.post('/io_search', function(req, res){
	res.sendFile(__dirname + "/HTML/io_search_result.html");
});

app.get('/io_search_API', function(req, res){
	connection.query("SELECT * FROM REGION_COORD;", function (err, rows) {
			if (err) throw err;
			res.send(rows);
	});
});


// Function 3-2. Update IO Coordinator region (웹에서 간단하게 지역 담당 직원 변경. 직원 해고/고용으로 인한 직원 레코드 자체의 INSERT/DELETE는 구현안함)
app.post('/io_update', function(req, res){
	console.log(req.body); // log to the node.js server

	// Invalid input for CID or RID → put alert box on page
	if (req.body.coord_CID <= 0 || req.body.coord_CID > 9 || req.body.region_CID <= 0 || req.body.region_CID > 10){
		res.sendFile(__dirname + "/HTML/alert_box.html");
		return
	}

	if(req.body.password === "1234"){
		queryStr = "UPDATE Region SET CID = "+req.body.coord_CID+" WHERE RID = "+req.body.region_CID+";";

		console.log("Insert query: " + queryStr); // you may check the queryStr

		connection.query(queryStr, function (err, rows) { // send query to MySQL
			if (err) throw err;
			console.log(rows); // log to check MySQL update result
			res.sendFile(__dirname + "/HTML/success_box.html");  // Put success box on page
		})
	} else {
		// Wrong password error message → put wrong password alert box on page
		res.sendFile(__dirname + "/HTML/alert_wrong_password.html");
		return
	}
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
