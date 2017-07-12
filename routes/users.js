var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
    var db = req.db;
    console.log("Responding With Database Contents");
    db.collection('stationlist').find().toArray(function (err, items) {
    	console.log(err);
        res.json(items);
    });
});

router.post('/addstation', function(req, res){
	var db=req.db;
	db.collection('stationlist').insert(req.body, function(err, results){
		res.send((err===null) ? {msg: ''} : {msg:err});
	})
});

module.exports = router;
