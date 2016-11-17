var DATE_REGEX = /^\w{3} (.*?) \+/;
var MESSAGE_LIMIT = 10;

var socket = new WebSocket('ws://localhost:8081');
var messages = {};

var guard = function(m){
  return (m != undefined &&
          m.length > 0);
};

var update_DOM = function(messages) {
  var output = '';
  var line = '';

  if (guard(messages)) {
    messages.slice(0, MESSAGE_LIMIT).forEach(function(m){
      if ((typeof(m) == 'object') &&
          m.user &&
          m.user.screen_name &&
          m.text &&
          m.created_at) {
        var line = '<ul class="tweets">\n'
        var sender = '<span class="screen-name">' + m.user.screen_name + '</span>';
        var text = '<span class="text">' + m.text + '</span>';
        var date = '<span class="timestamp">' + DATE_REGEX.exec(m.created_at)[1] + '</span>';
        var tweet = date + " from @" + sender + ": " + text;
        line += '<li class="tweet">' + tweet + '</li>\n'
        line += '</ul>\n';
      } else {
        // No tweet to display
      };
      output += line;
    });
    document.getElementById('tweets').innerHTML = output;
    return true;
  } else {
    output = "No messages to display on " + (new Date()).toDateString();
    console.log(output);
    document.getElementById('tweets').innerHTML = output;
    return false;
  }
}

socket.onmessage = function(event){
  try {
    messages = JSON.parse(event.data).statuses;
    console.log(JSON.stringify(messages[0], null, 2));
    document.getElementById('error').style.display = 'none';
    update_DOM(messages);
  } catch (e) {
    output = "We received an error from the server.<br/>" + e.message;
    document.getElementById('error').innerHTML = output;
    document.getElementById('error').style.display = 'block';
    console.log(output);
  }
}
