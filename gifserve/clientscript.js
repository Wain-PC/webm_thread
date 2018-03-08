$('.webm-file')
    .mouseover(function () {
   var href = this.parentNode.getAttribute('href');
   var resultHref = 'http://localhost:8080/2ch.hk' + href + '.gif';
   console.log(href, resultHref);
   this.setAttribute('src', resultHref);
}).mouseout(function () {
   var href = this.parentNode.getAttribute('href');
   var resultHref = href.replace('src', 'thumb').replace(/\.mp4|\.webm/, 's.jpg');
   console.log(href, resultHref);
   this.setAttribute('src', resultHref);
});