//var io = require('socket.io').listen(8008);
var sio = require('socket.io');
var fs = require('fs');
var cluster = require('cluster');

function readTopStories(callback){
  fs.readFile('sites/default/files/topStories.out', "UTF-8", function(err, data){
    if(err){
      //throw err;
      console.log("Error reading topStories.out: " + err);
      return;
    }
    callback(data);
  });
}

//The cluster lets us run multiple processes for this
//  since each one doesn't need to communicate with the others, that should work fine.
if(cluster.isMaster){
  for(var i = 0; i < 2; i++){
    cluster.fork();
  }
}else{
  var io = sio.listen(8008);
  io.set('log level', 1);
  var lastTopStoriesUpdate = new Date();
  //When the top stories block file is updated, send it to everyone
  fs.watch('sites/default/files/topStories.out', function(cur, prev){
    var newDate = new Date();
    //Limit the updates to 1 per second
    if((newDate.getTime() - lastTopStoriesUpdate.getTime()) < 1000){
      console.log("New update too soon!");
      return;
    }else{
      lastTopStoriesUpdate = newDate;
      readTopStories(function(data){
        //console.log(data);
        console.log('file read... sending');
        //socket.broadcast.emit("top stories update", {update: data});
        //We want to send this to all clients, using broadcast within connection would cause
        //  the first connection not to update, it seems
        io.sockets.emit("top stories update", {update: data});
      });
    }
  });

  io.sockets.on('connection', function(socket){
    console.log('got a connection');
    //Send one client the top stories block
    socket.on('update top stories', function(){
      readTopStories(function(data){
        //console.log(data);
        socket.emit('top stories update', {update: data});
      });
    });
  });
}
