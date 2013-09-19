//node.js push updates
var elt;
var newestUpdate = "";
var nodeSocket = io.connect("http://" + window.location.host + ":8008", {
                            'connect_timeout': 500,
                            'reconnect': true,
                            'reconnection delay': 500,
                            'reopen delay': 500,
                            'max reconnection attempts': 10
                          });

//Sets up a socket.io callback:
//  message - the message from the server to respond to
//  element - either a dom object or a selector string
//      of the element to update
function onNodeMessage(message, element){
  nodeSocket.on(message, function(data){
    //This makes the element into a jquery object, whether it's
    //  a selector string, a dom element, or a jquery object
    element = $(element);

    //Make sure the content has changed
    //Have to check this way because .html does some conversions on the text
    if($("<div />").html(data.update).html() == element.html()){
      //console.log("Update is same content, not updating");
      return;
    }
    if(data.update != ""){
      //console.log('got an update');
      element.fadeOut(400, function(){
        element.html(data.update);
        element.fadeIn();
      });
    }
  });
}

//We only need to respond to connect once
nodeSocket.once('connect', function(){
  onNodeMessage('top stories update', '#block-views-top_stories-block_1 div.content');
  nodeSocket.emit('update top stories');
});
nodeSocket.on('connect_failed', function(){
  //console.log('connection failed');
});
nodeSocket.on('reconnect', function(){
  //console.log('Reconnected');
});
