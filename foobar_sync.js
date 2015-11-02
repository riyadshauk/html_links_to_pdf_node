var fs = require('fs');
var wk = require('wkhtmltopdf');
var cheerio = require('cheerio');
var https = require('https');
var StringDecoder = require('string_decoder').StringDecoder;

var listings_url = 'https://github.com/angrave/SystemProgramming/wiki';
// var $ = cheerio.load(fs.readFileSync('listings.html'));
// wk('html').pipe(fs.createWriteStream('out.pdf'));

var getListingsHtml = function(cb) {
  // listings_html should store page containing a list of links
  // which should be saved as html in getAndSaveHtml
  var listings_html = '';
  var req = https.get(listings_url, function(res) {
    var decoder = new StringDecoder('utf8');
    res.on('data', function(d, res_err) {
      if(res_err) console.error('listings res_error: '+res_err);
      listings_html += decoder.write(d);
    });
    res.on('end', function(res_end_err) {
      if(res_end_err) console.error('listings res_end_err: '+res_end_err);
      var $ = cheerio.load(listings_html);
      // console.log(listings_html);
      // console.log($('.internal.present'));
      cb($);
      // console.log(listings_html);
    });
  });
  req.end();
}

// getListingsHtml();

var getNumLinks = function(cb) {
  var $;
  getListingsHtml(function($) {
    cb($('.internal.present').length);
  });
}

// getNumLinks();

var getLink = function(idx, cb) {
  var $;
  getListingsHtml(function($) {
    cb('https://github.com'+$('.internal.present').eq(idx).attr('href'));
  });
}

var getLinks = function(cb) {
  getNumLinks(function(num_links) {
    var arr = [];
    // console.log('getting num links in getLinks');
    var recurse = function(i, rcb) {
      getLink(i, function(link) {
        arr[i] = link;
        console.log('getting link '+i+': '+link);
        // num_links = 3; // temporarily, for testing. Delete later.
        if(i+1 < 3) recurse(i+1);
        else {
          // console.log('arr: '+arr);
          cb(arr);
        }
      });
    }
    recurse(0);
  });
}

var pages = [];
var book = '';
var getAndSaveHtml = function(i, cb) {
  if(i < 3) {
    cb();
  }
  var links = [];
  getLinks(function(l) {
    links = l;
    console.log('links: '+links);
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
        fs.writeFile('page'+i+'.html', parsed, function(err) {
          if(err) console.error('err: '+err);
          else console.log('page'+i+'.html saved!');
        });
      });
    });
    req.end();
    if(i+1 < 3) {
      getAndSaveHtml(i+1, displayContent);
    }
    // else {
    //   book += $('head');
    //   for(var i = 0; i < 3; i++) {
    //     // book += pages[i];
    //     console.log(pages[i]);
    //   }
    //   wk(book).pipe(fs.createWriteStream('out.pdf'));
    // }
  });
}

var displayContent = function() {
  // book += $('head');
    // book += pages[i];
  // console.log(pages[i]);
  // if(i+1 == 3)
  //   wk(book).pipe(fs.createWriteStream('out.pdf'));
}


getAndSaveHtml(0, displayContent);
