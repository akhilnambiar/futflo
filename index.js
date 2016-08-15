var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();
var pg = require('pg');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/times', function(request, response) {
    var result = ''
    var times = process.env.TIMES || 5
    for (i=0; i < times; i++)
      result += i + ' ';
  response.send(result);
});

//calls for the database

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { 
       	response.render('pages/db', {results: result.rows} ); 
       }
    });
  });
});

//getting the clips

/*
@Return

JSON with the following fields

name: An array with the names of the clips
url: An array with the url of the clips

*/

app.get('/get_clips', function (req, res) {
	//SAVE: You are going to find specific vid.me playlists and then return those videos to the server.

	//setting some defaults
	req = request.defaults({
		jar: true,                 // save cookies to jar
		rejectUnauthorized: false, 
		followAllRedirects: true   // allow redirections
	});

	// Getting scraped links from the home page
	// scrape the page
	var scraped_links = [];
	req.get({
    	url: "http://www.hoofoot.com/",
    	headers: {
        	'User-Agent': 'Super Cool Browser' // optional headers
     		}
  		}, function(err, resp, body) {
	
		// load the html into cheerio
		var $ = cheerio.load(body);
	
		// get the data and output to console
		console.log("Starting to Browse");
		
		links = $('a'); //jquery get all hyperlinks
  		$(links).each(function(i, link){
  			if($(link).attr('href').indexOf("match") > -1) {
  				//console.log($(link).text() + ':\n  ' + $(link).attr('href'));
  				if ($(link).attr('href')!=scraped_links[scraped_links.length-1]){
  					scraped_links.push($(link).attr('href'));
  				}
			}
  		});
  		console.log(scraped_links);

  		//Now we have a list of all links that work, we now need to get scraped videos
		var scraped_video_links=[];
		var items_processed=0;

		//we use this to make sure we don't send 2 JSON responses
		var response_sent = false;

		for (j = 0; j < scraped_links.length; j++) { 
			home_link = scraped_links[j];
			req.get({
			url: "http://www.hoofoot.com".concat(home_link),
			headers: {
				'User-Agent': 'Super Cool Browser' // optional headers
			}
			
			}, function(err2, resp2, body2) {

				
				// load the html into cheerio
				//console.log(body2);
				$ = cheerio.load(body2);
				// get the data and output to console
				console.log("Starting to get the video");
				links = $('iframe'); //jquery get all hyperlinks
				$(links).each(function(i, link){
					if ( !($(link).attr('src').indexOf("facebook")>-1) && !($(link).attr('src').indexOf("twitter")>-1)) {
						scraped_video_links.push($(link).attr('src'));
						items_processed++;
						console.log(items_processed);
					}
				});
				if (scraped_links.length==items_processed){
					console.log(scraped_video_links);
					res.send({ video_list: scraped_video_links, list_length: scraped_video_links.length });
					res.end();
					response_sent=true
					return;
				}
				
			})

		}
		//If all else fails, return the items after 10 seconds
		setTimeout(function(){
				if (!response_sent){
					console.log(scraped_video_links);
					res.send({ video_list: scraped_video_links });
					res.end();
					return;
					//return scraped_video_links;
				}
		}, 10000);
  	});
	
});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

//OLD CODE


     //Old method that worked

    /*
    url = 'http://hoofoot.com/'
    request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        

        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);
            console.log("...Starting to traverse DOM...");
    		console.log($(html).text());
            //Uncomment me here
          
            //we are going to find the preview images
            //we use the unique locator of each of the locators to preview the URL



            // Finally, we'll define the variables we're going to capture

            var title, release, rating;
            var json = { title : "", release : "", rating : ""};
        }
    })
    */


