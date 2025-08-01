// OpenRouter AI API endpoint - replace with your actual API endpoint
const API_ENDPOINT = '/api/chat'; // This will be handled by Netlify Functions

function chatBot() {
  this.input;
  
  this.respondTo = async function (input) {
    this.input = input.toLowerCase();
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "I'm sorry, I couldn't process that request.";
      
    } catch (error) {
      console.error('Error calling API:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  this.match = function (regex) {
    return new RegExp(regex).test(this.input);
  };
}

$(function () {
  var you = 'You';
  var robot = 'Melissa';

  var delayStart = 400;
  var delayEnd = 800;

  var bot = new chatBot();
  var chat = $('.chat');
  var waiting = 0;
  $('.busy').text(robot + ' is typing...');

  var submitChat = async function () {
    var input = $('.input textarea').val();
    if (input == '') return;

    $('.input textarea').val('');
    updateChat(you, input);

    $('.busy').css('display', 'block');
    waiting++;

    try {
      var reply = await bot.respondTo(input);
      
      setTimeout(function () {
        if (typeof reply === 'string') {
          updateChat(robot, reply);
          new Audio('chat.mp3').play();
        } else {
          for (var r in reply) {
            updateChat(robot, reply[r]);
            new Audio('chat.mp3').play();
          }
        }
        if (--waiting == 0) $('.busy').css('display', 'none');
      }, Math.floor(Math.random() * (delayEnd - delayStart) + delayStart));
      
    } catch (error) {
      console.error('Error in submitChat:', error);
      setTimeout(function () {
        updateChat(robot, "I'm sorry, something went wrong. Please try again.");
        if (--waiting == 0) $('.busy').css('display', 'none');
      }, delayStart);
    }
  };

  var updateChat = function (party, text) {
    var style = 'you';
    if (party != you) {
      style = 'other';
    }

    var line = $('<div class="msg-bubble"><span class="party"></span> <span class="text"></span> <span class="time"></span></div>');
    line.find('.party').addClass(style).text(party + ':');
    line.find('.text').text(text);
    line.find('.time').text(new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric"}));
    
    chat.append(line);
    chat.stop().animate({ scrollTop: chat.prop("scrollHeight") });
  };

  $('.input button').bind('click', submitChat);
  
  // Handle Enter key press
  $('.input textarea').bind('keypress', function(e) {
    if (e.which == 13 && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  });

  // Initial greeting
  updateChat(robot, "Hi there, I'm Melissa! How can I help you today?");
});