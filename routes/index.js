var express = require('express');
var router = express.Router();
var server_tools = require('../node_modules/server_tools/server_tools.js');

var io;
/* GET home page. */
router.get('/', function(req, res, next) {
	var _date=Date();
  res.render('../views/home.jade', { title: 'Express' , date: Date()});
});

//this is an update from a groundstation
router.post('/p', function(req, res)
{ 
	//we should probably pass this to server_tools
    console.log(req.body.groundstation_name + ":" + req.body.groundstation_id + ":" + req.body.message);

    /*
    res.writeHead(200, {'Content-Type':'text/plaintext'});
    res.end();
*/
    var payload={message:req.body.message, groundstation_name: req.body.groundstation_name, groundstation_id: req.body.groundstation_id, number_of_swaps:req.body.swaps};
    server_tools.parsePost(payload, io);

    // if you want to send to socket

});

// module.exports = router;
module.exports = function (_io) {

	io = _io;

	return router;
}