var DATE_REGEX = /^\w{3}\s(\w{3}\s\d{1,2})/

var socket = new WebSocket('ws://localhost:8081');

socket.onmessage = function(event){
  var messages = JSON.parse(event.data).statuses;
  console.log(JSON.stringify(messages[0], null, 2));
  
  if (messages.length) {
    var output = '<ul>\n'
    messages.forEach(function(m){
      var sender = '<span class="person">' + m.user.screen_name + '</span>';
      var text = '<span class="text">' + m.text + '</span>';
      var date = '<span class="date">' + DATE_REGEX.exec(m.created_at)[1] + '</span>';
      var tweet = date + " from @" + sender + " : " + text;
      output += '<li class="tweet">' + tweet + '</li>\n'
    });
    output += '</ul>\n';
    document.getElementById('tweets_go_here').innerHTML=output;
  }
}
