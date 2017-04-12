const cheerio = require('cheerio');

var request = require('request');

var XMLWriter = require('xml-writer')

exports.handler = function(event, context, callback) {
	var xw = new XMLWriter;
	var query = event.path.match("^\\/rss\\/(\\w*).*")[1];
	xw.startDocument().startElement('rss').writeAttribute('version', '2.0')
			.startElement('channel')
			.writeElement('title', "".concat('Placera nyhetssök: ', query))
			.writeElement('link', "".concat('https://www.avanza.se/placera/sok.html?sok=', query))
			.writeElement('description', "".concat('Nyheter från sökning på: ', query))
			.writeElement('language', 'sv-se')
			.writeElement('generator', 'aws-lambda-web-scraping');

	request({
		  uri: "https://www.avanza.se/placera/sok.html?sok=Systemair",
		}, function(error, response, body) {
		  var $ = cheerio.load(body);
		  var searchItems = $(".searchItem");

		  var processedItems = 0;
		  searchItems.each(function(index, element) {
		  	xw.startElement('item');
		  	
		  	var title = $(this).find('h2').text();
		  	xw.writeElement('title', title);

		  	/* 
		  	 * Can contain irregular whitespace - split on whitespace
		  	 * gives array of words that are joined with single space
			 */
		  	var description = $(this)
		  			.find('.intro')
	  				.text()
	  				.split(/\s/g)
	  				.join(' ')
	  				.trim();

		  	xw.writeElement('description', description);

		  	var link = $(this).attr('href');
		  	xw.writeElement('link', link);

		  	// Parse out the date string
		  	var publishedDate = $(this).find('.publishedBy').text().match("(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2})")[1];
		  	
		  	// Set milliseconds is expecting elapsed time in seconds
		  	// but parse returns milliseconds
		  	var milliseconds = Date.parse(publishedDate) / 1000;
		  	var date = new Date();
		  	date.setMilliseconds(milliseconds);
			xw.writeElement('pubDate', date.toUTCString());

			xw.endElement('item');

			processedItems++;
			// Limits feed to last 20 items
			if (processedItems >= 20) {
				return false;
			}
		  })

		  callback(null, xw.toString());
		});

 //    var data = {"awsRequestId":context.awsRequestId};
 //    console.log('Data: %s', data);

	// $('h2.title').text('Hello there!');
	// $('h2').addClass('welcome');

	// console.log($.html());


	// callback(null, result);

};