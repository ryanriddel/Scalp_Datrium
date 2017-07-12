//Setup =======================================
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

global.appRoot=path.resolve(__dirname);

var mongo = require('mongodb');
var monk = require('monk');
var mysql = require('mysql');

var flexHistDB = monk('10.5.128.51:1433/FlexHist');

var flexHistConnection = mysql.createConnection({
  host:'10.5.128.51',
  port: '1433',
  user:'sa',
  password: 'ftas',
  database: 'FlexHist'
});

var localDB;
var mongoDB = require('mongodb');

try
{

  mongoDB.MongoClient.connect("mongodb://localhost:21234/data", {native_parser:true}, function(err, db)
  {
    console.log("CONNECTED TO DB");
    console.log(db.databaseName);
    if (err) 
    {
        console.error("db connection failed" + err);
        return;
    } 
    else 
    {
        localDB = db;
        
    }
    var newRecord = {"dumpID" : "1", "computerID" : "2", "dumpDate" : " 2016-08-12" , "loginName" : "rr", "blazeVersion" : "5.2.2", "windowHistory" : [ { "1:22:10" : "Orders" }, { "1:22:15" : "Options" } ], "actionHistory" : [ { "1:22:11" : "click send" } ], "sessionExceptions" : [ { "1:22:12" : "Index not found" } ], "applicationRam" : [ { "1:20:00" : "145152523" }, { "1:21:00" : "145123" }, { "1:22:00" : "14621231" } ], "networkUsage" : [ { "1:20:00" : "1322131" }, {"1:21:00" : "14561"}, {"1:22:00" : "1324000"} ], "systemRAM" : "8" };
    //localDB.collection("sessionList").remove({});
      
     // db.collection("sessionList").insert(newRecord);
      
      //localDB.collection("sessionList").find().toArray(function(err, items) {console.log(items)});    

      console.log("DB STATS: ");
      var DBSTATS = db.collection("sessionList").stats({ dbStats: 1, scale: 1024 });
      console.log(DBSTATS);
    

  });
  //flexHistConnection.connect();
}
catch(err)
{
  console.log("db error: "  + err.message);
}

flexHistDB.mysql=flexHistConnection; 

//var sessionDB = mongo.db("mongodb://localhost:21234/db", {native_parser:true}, null);

var io;

var app=express();
//app.listen(443);
var http=require('http').Server(app);

var io=require('socket.io')(http);
io.origins('*:*') // prevent firefox exceptions

http.listen(8089, function()
{
  console.log("Listening on 8089");
})
//***************************************************************



//SOCKET HANDLING

console.log("Starting Dashbug Server...");

try
{
    
    io.on('connection', function(socket)
    {
      console.log("Socket Connection Established...");



      socket.on('initialization_data_request', function(data)
        {
          //first, send data to jqgrid.

          //send the last N session dumps, sorted from most recent
          var numberOfRowsToSendClient = 50;

          localDB.collection("sessionList").find({}, {}, function(err, items)
          {
            //console.log(items);
          });
          
         localDB.collection("sessionList").find({},{sort: {$natural : 1}, limit: numberOfRowsToSendClient}).toArray(function(err, data)
         {
                socket.emit('fill_session_data_table', data);
          });
          
        });

      //if the client wants all the records that correspond to a given 
      //computer id, he will send computerID_match_request
      socket.on('computerID_match_request', function(data)
      {
        localDB.collection("sessionList").find({computerID : data.computerID}, {}, function(err, items)
        {
          socket.emit("computerID_match_response", items);
        })
      });



    });



}
catch(exception)
{
    console.log("socket exception: " + exception);
}


//==============================================
var mode="DEBUG";


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('node_modules'));

app.use(function(req, res, next)
{
  //req.db=db;
  next();
});

app.use('/', routes);
app.use('/users', users);





app.post('/home', function(req, res)
{
  console.log("Login Attempt Made");

  var enteredUsername=req.body.username;
  var enteredPassword=req.body.password;

  console.log("User has entered " + enteredUsername + " & " + enteredPassword);
  localDB.collection("userlist").find({"username" : enteredUsername, "password" : enteredPassword}, {}, function(err, cursor)
  {
    console.log("Checking Credentials...");
   // console.log(cursor.cmd);
    if(cursor.cmd.query.username == enteredUsername && cursor.cmd.query.password == enteredPassword)
    {
      //login success
      console.log("Login Successful: " + enteredUsername);
      res.sendFile(global.appRoot + '/home.html');

    }
    else
    {
      //res.sendFile(global.appRoot + '/home.html');
      alert("Invalid Credentials");
    }

  });
});



function jsonConcat(o1, o2) {
 for (var key in o2) {
  o1[key] = o2[key];
 }
 return o1;
}




app.post('/data', function(req, res)
{
  console.log("Data received from client...");
 // console.log(req);
  var response = "response";
  
//  console.log(req);
  //console.log(sessionData);
  //console.log(sessionData.applicationRAM);

  if(localDB != null)
  {
  //It's likely that there is already an entry in the DB for this session.
  //The following takes care of that case

  try
  {
    var sessionData = req.body;

    //console.log(sessionData.taskList);
    sessionData.applicationRam = JSON.parse(sessionData.applicationRam);
    sessionData.networkUsage = JSON.parse(sessionData.networkUsage);
    sessionData.actionHistory = JSON.parse(sessionData.actionHistory);
    sessionData.windowHistory = JSON.parse(sessionData.windowHistory);
    sessionData.sessionExceptions = JSON.parse(sessionData.sessionExceptions);
    sessionData.windowLatency = JSON.parse(sessionData.windowLatency);
    sessionData.taskList = JSON.parse(sessionData.taskList);

    console.log(sessionData);
    
    //sessionData.logMessages = String(sessionData.logMessages);
    //var cursor = localDB.collection('sessionList').find({"dumpID" : sessionData.dumpID}, {}, function(err, cursor) { console.log(cursor);});
    //console.log(cursor);

    localDB.collection('sessionList').find({_id: sessionData.dumpID})

    //localDB.collection('sessionList').find({"dumpID": sessionData.dumpID})

    var cursor2 = localDB.collection('sessionList').update(
    // query 
      
        {
        _id : sessionData.dumpID
        },

      {
        $setOnInsert:
          {
            _id: sessionData.dumpID,
            dumpID: sessionData.dumpID,
            computerID : sessionData.computerID,
            blazeVersion : sessionData.blazeVersion,
            dumpDate : sessionData.dumpDate,
            systemRAM : sessionData.systemRam,
            loginName: sessionData.loginName,
            entityName: sessionData.entityName,
            userType: sessionData.userType,
            timeAtStartup: sessionData.timeAtStartup,
            
            windowHistory: sessionData.windowHistory,
            sessionExceptions: sessionData.sessionExceptions,
            applicationRam : sessionData.applicationRam,
            actionHistory : sessionData.actionHistory,
            networkUsage : sessionData.networkUsage,
            taskList : sessionData.taskList,
            localIP : sessionData.localIP,
            connectionInfo : sessionData.connectionInfo,
            processorInfo: sessionData.processorInfo,
            currentDirectory: sessionData.currentDirectory,
            windowLatency: sessionData.windowLatency,
            logMessages: sessionData.logMessages
          }
          //update
          //append 
      },

      {
          multi : false,  // update only one document 
          upsert: true
           
      },
      function(err, items)
      {

        console.log("CALLBACK");
        if(typeof items.result.upserted == "undefined")
        {
          console.log("updating data...");
          
          
          localDB.collection("sessionList").update(
          {
            _id: sessionData.dumpID
          },
          {
             $push: 
              { 
                windowHistory: { $each: sessionData.windowHistory}, 
                actionHistory : {$each: sessionData.actionHistory},
                networkUsage : {$each: sessionData.networkUsage},
                applicationRam: {$each: sessionData.applicationRam},
                sessionExceptions: {$each: sessionData.sessionExceptions},
                windowLatency: {$each: sessionData.windowLatency}
              }
          },
          {
            //upsert : false  // insert a new document, if no existing document match the query
          },
          function(err3, items4)
          {
            console.log("done pushing");
            localDB.collection("sessionList").findOne({_id: sessionData.dumpID}, function(err, doc)
            {

              //sessionData.taskList = Array(sessionData.taskList);
              //doc = Array(doc.taskList[0])[0];
              //console.log(doc[0]);
              /*var convertedDoc = doc.reduce(function(map, obj){
                map[obj.taskName] = obj.timeSeries;
                return map;
              }, {});
              console.log(convertedDoc);
              console.log(convertedDoc['flexApp']);*/
              //console.log(doc.taskList);
            }); 
            
          }

          );
          
        }
        else
        {

        }
    
      });

    }
    catch(exception)
    {
      console.log(exception);

    }
  }
  res.end("response");
});























// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//Error Handlers =============================
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
//=============================================

module.exports = app;
