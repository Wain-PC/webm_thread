$(document)
    .on('mouseover', '.webm-file', function () {
   var resultHref = 'http://localhost:8080/2ch.hk' + this.parentNode.getAttribute('href') + '.gif';
   this.setAttribute('src', resultHref);
}).on('mouseout', '.webm-file', function () {
   var resultHref = this.parentNode.getAttribute('href').replace('src', 'thumb').replace(/\.mp4|\.webm/, 's.jpg');
   this.setAttribute('src', resultHref);
});