var DATE_REGEX = /^\w{3}\s(\w{3}\s\d{1,2})/;
var MESSAGE_LIMIT = 10;

var socket = new WebSocket('ws://localhost:8081');
var messages = {};

var guard = function(m){
  return (m != undefined &&
          m.length > 0);
};

var update_DOM = function(messages){
  var output = '';
  var line = '';
  
  if (guard(messages)) {
    messages.slice(1, MESSAGE_LIMIT).forEach(function(m){
      if ((typeof(m) == 'object') &&
          m.user &&
          m.user.screen_name &&
          m.text &&
          m.created_at) {
        var line = '<ul>\n'
        var sender = '<span class="person">' + m.user.screen_name + '</span>';
        var text = '<span class="text">' + m.text + '</span>';
        var date = '<span class="date">' + DATE_REGEX.exec(m.created_at)[1] + '</span>';
        var tweet = date + " from @" + sender + " : " + text;
        line += '<li class="tweet">' + tweet + '</li>\n'
        line += '</ul>\n';
      } else {
        // No tweet to display
      };
      output += line;
    });
    document.getElementById('tweets_go_here').innerHTML=output;
    return true;
  } else {
    console.log("No messages to display" + Date('now'));
    return false;
  }
}

socket.onmessage = function(event){
  try {
    messages = JSON.parse(event.data).statuses;
    console.log(JSON.stringify(messages[0], null, 2));
    update_DOM(messages);
  } catch(e) {
    console.log("Error parsing JSON: " + JSON.stringify(e, null, 2));
  }
}
