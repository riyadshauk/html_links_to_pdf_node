var fs = require('fs');
var wk = require('wkhtmltopdf');
var cheerio = require('cheerio');
var https = require('https');
var StringDecoder = require('string_decoder').StringDecoder;
var url = 'https://github.com/angrave/SystemProgramming/wiki';
var $ = cheerio.load(fs.readFileSync('listings.html'));
// wk('html').pipe(fs.createWriteStream('out.pdf'));
var num_links = $('.internal.present').length;
var getLinks = function(cb) {
  var arr = [];
  for(var i = 0; i < num_links; i++) {
    arr[i] = 'https://github.com'+$('.internal.present').eq(i).attr('href');
  }
  cb(arr);
}

var links = [];
getLinks(function(l) {
  links = l;
});

var getAndSaveHtml = function(links, pages, book, i) {
  var req = https.get(links[i], function(res) {
    var decoder = new StringDecoder('utf8');
    var html = '';
    res.on('data', function(d, res_err) {
      if(res_err) console.error('res_error: '+res_err);
      html += decoder.write(d);
    });
    res.on('end', function(res_end_err) {
      if(res_end_err) console.error('res_end_err: '+res_end_err);
      var parsed = '';
      var $ = cheerio.load(html); // locally scoped $-declaration
      // parsed += $('head');
      parsed += $('.gh-header-show');
      parsed += $('.markdown-body');
      parsed += $('.wiki-footer');
      pages[i] = parsed;

      pages[i] = pages[i].replace('<body>','');
      pages[i] = pages[i].replace('</body>','');
      pages[i] = pages[i].replace('<head>','');
      pages[i] = pages[i].replace('</head>','');
      pages[i] = pages[i].replace('<html>','');
      pages[i] = pages[i].replace('</html>','');
      book += pages[i];

      parsed = pages[i];

      fs.writeFile('page'+i+'.html', parsed, function(err) {
        if(err) console.error('err: '+err);
        else console.log('page'+i+'.html saved!');
      });
    });
  });
  req.end();
  if(i+1 < 3) {
    getAndSaveHtml(links, pages, book, i+1);
  } else {
    var pre = '';
    pre += '<html>';
    pre += '<body>';
    pre += book;
    pre += '</body>';
    pre += $('head');
    pre += '</html>';
    console.log('book: '+pre);
    // book += '<html>';
    // book += $('head');
    // book += '<body>';
    // for(var i = 0; i < 3; i++) {
    //   console.log(pages[i]);
    //   pages[i] = pages[i].replace('<body>','');
    //   pages[i] = pages[i].replace('</body>','');
    //   pages[i] = pages[i].replace('<head>','');
    //   pages[i] = pages[i].replace('</head>','');
    //   pages[i] = pages[i].replace('<html>','');
    //   pages[i] = pages[i].replace('</html>','');
    //   book += pages[i];
    //   console.log(pages[i]);
    // }
    // book += '</body>';
    // book += '</html>';

    wk(pre).pipe(fs.createWriteStream('out.pdf'));
  }
}

var pages = [];
var book = '';
getAndSaveHtml(links, pages, book, 0);
