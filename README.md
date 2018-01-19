# RMLS-Parse
Notice how the RMLS website is very hard to use? this tool scrapes data from their website. 
Then parses out the data so that it can be filtered and searched. Then wraps this data with angular material UI and
also plots the data onto google maps.

### Please Note
This project is a work in progess.

This tool is intended to only be run locally.

### Requirements
You will need a url from RMLS (Regional Multiple Listing Service), this website is reserved to real 
estate agents and cannot be accessed to the public. You will also need access to google maps API.

### Getting Started
You will need to grab the url from a RMLS listing email. This url contains an ID; this ID needs to be updated
periodically. RMLS limits the amount of times this unique id can be used. This application caches the results,
so refreshing the browser does not make a new request to RMLS. Instead the user needs to manually press the in app 
refresh button.

1. clone this repo `https://github.com/c-asakawa/RMLS-Parse.git`
2. open up the `app.js` and update the RMLS ID and google maps api key.
3. done


### Demo Image
This is what the current state of the app looks like.

![Demo Image]
(https://github.com/c-asakawa/RMLS-Parse/blob/master/demoImage.png)


