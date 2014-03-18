$(document).ready(function() {
  $('input').focus(function() {
    $('input').select();
  });

  $('form').submit(function() {
    $.post('/l', {
      url: $('input').val()
    }, function(data, status, xhr) {
      $('input').val(data.hash).focus();
      $('p.error').html('');
    }).fail(function() {
      $('p.error').html('You are a terrible person.');
    });

    return false;
  });
});