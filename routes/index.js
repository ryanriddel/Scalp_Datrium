var express = require('express');
var router = express.Router();

router.get('/pnl', function(req, res, next){
	console.log("welcome to P&L");
	console.log(global.appRoot);
	res.sendFile(global.appRoot + '/pnl.html');


});

router.get('/', function(req, res)
{
	//res.render('login', { date: Date() });
	res.sendFile(global.appRoot + '/login.html');
});

router.get('/data', function(req, res)
{
	console.log("Data received");
	console.log(req.body);
});

module.exports = router;
