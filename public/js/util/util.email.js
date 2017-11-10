var SubscribeEmail = function(){
  var email = $('[name="subscribe-email"]').val();

  if (!email) return;

  $.post('/email/subscribe.json', {
    'email': email
  }, Belt.np);

  if (GAEnabled()) {
    ga('send', 'event', 'SubscribeModal', 'submit email');
  }

  if (FBEnabled()) {
    fbq('track', 'CompleteRegistration', {
      'status': 'submit email'
    });
  }

  $('.modal h3').html('Thank you for subscribing!');
  $('.modal form').hide();

  setTimeout(function(){
    $('.modal').modal('hide');
  }, 1000);
};

$(document).on('submit', '.modal form', function(e){
  e.preventDefault();

  SubscribeEmail();
});

$(document).on('click', '[name="email-submit"]', function(e){
  e.preventDefault();

  SubscribeEmail();
});
