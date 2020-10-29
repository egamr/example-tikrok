## Creating Your Own Video Social Network in Under 20 Minutes!

In this tutorial, you will build an MVP of a video social network called Tikrok with a face filter powered by Kaltura with a node.js back end and a javascript front end.



![HighLevel](readme_images/HighLevel.png)

## Try it Live:

https://tik-rok.herokuapp.com/

## Design Choices

Many shortcuts were taken in order to give you the barebones, simplest implementation of this concept aka an MVP. I chose a web front end to give a low barrier to entry accross any platform. While recording does not work on all mobile browsers, the facefilters do, and a more robust implementation could make use of Kaltura's many [Client Libraries](https://developer.kaltura.com/api-docs/Client_Libraries) 

## This is just a kernel...

Don’t limit yourself to copying TikRok, the purpose of this tutorial is to ignite your creativity. There are so many directions you **could** go in…..for example, there are open source emotion-recogition engines….why not make an app that detects if someone is sad or angry (show video example of Hunter doing sad face + detection) and notify their friends they need cheering up? Food for thought. Think big, think different, be bold. Do something so amazing they can’t ignore you. And it doesn’t have to be entertaining….think healthcare/covid-19, think education, think business, think food, fashion, music, finance, holidays, think what can I do with face detection, or just something creative with video?

<img src="readme_images/HAPPY.jpg" alt="HAPPY" style="zoom:30%;" />

From https://github.com/justadudewhohacks/face-api.js/

## Introducing TikRok

This sample, fully functional social network lets you use a funny face filter to make a video, upload it, browse everyone's videos, and has a user page. 

## Getting Started

1. First, You will need a free Kaltura account: start a [free trial](https://vpaas.kaltura.com/register)

2. Clone the TikRok Github repo https://github.com/kaltura-vpaas/example-tikrok

3. Let's take a look at .env.template:

   ```json
   ADMIN_SECRET=abcdefg
   PARTNER_ID=123456
   PLAYER_ID=3456789
   ```

   We are going to need to get your codes for each of these so lets head over to [Integration Settings tab](https://kmc.kaltura.com/index.php/kmcng/settings/integrationSettings)

   <img src="readme_images/KMC_CODES.png" alt="KMC_CODES" style="zoom:45%;" />

Head over to https://kmc.kaltura.com/index.php/kmcng/studio/v3 , create a player and get its ID. Make sure to create your player through the "TV Platform Studio" as pictured:



<img src="readme_images/KMC_PLAYER.png" alt="KMC_PLAYER.png" style="zoom:50%;" />

Edit the values in `.env.template` and copy the file to `.env`

4. Install the components for this node:

`npm install`

5. **Its Showtime!!** run 

   `npm start`

   and head over to 

   `http://localhost:3000`

## Connecting the back end to Kaltura

Pick a screen name and hit go:

![SCREEN_NAME](readme_images/SCREEN_NAME.png)

The next touch point is the `router.post('/', `method of `routes/login.js`

``` javascript
var adminks = await KalturaClientFactory.getKS('', {type: kaltura.enums.SessionType.ADMIN});
var client = await KalturaClientFactory.getClient(adminks);
var user = await getOrCreateUser(client, req.body.userId);
var userKs = await KalturaClientFactory.getKS(user.id,{privileges: 'editadmintags:*'});
```

Take a look at `lib/KalturaClientFactory.js` to see how the [Kaltura Session](https://developer.kaltura.com/api-docs/VPaaS-API-Getting-Started/how-to-create-kaltura-session.html) is created

We first create an admin session `adminks` which is required to create a user. Then we create a user session `userKs` which is the only session we will use for everything else we do after this.

Then we store the `userKs` to the node session so it can be used later.

`req.session.ks = userKs;`

And then we are redirected to the ***REALLY*** fun stuff!

## The Face Filter 

We use the open source face filter library https://github.com/jeeliz/jeelizFaceFilter There is nothing stopping you from getting very creative with these filters! You could supply your own artwork....the sky is the limit!

Here is a high level overview of how we are actually creating a video with a face filter 

![FaceFilter](readme_images/FaceFilter.png)

By itself, the facefilter demo displays to a canvas element. Some of the demo's use `<divs>` to display graphics on top of a canvas, those demos won't work with our approach.

### Loading and Switching Filters

 First, lets set up the filter:

```html
<style type="text/css">
.vidsize {
    width:600px;
    height:600px;
}
</style
</head>
<body onload="init_filter()">
    <div class="vidsize" style="margin:0 auto;position: relative;">
        <div id="loading" class="loading">
            Loading Filter 
            <br>
            <img class="loading" src="/readme_images/loading_black.png">
        </div>
        <div id="filterRow">
            <a href="#" onclick="loadFilter('football')">🇫🇷</a>
            <a href="#" onclick="loadFilter('angel')">😇😈</a>
            <a href="#" onclick="loadFilter('deform')">🥴</a>
            <a href="#" onclick="loadFilter('faceswap')">😀🔄😀</a>
        </div>
        <div id="filterBtn"><a href="#" onclick="filterBtnToggle()">😃</a></div>
        <canvas width="600" height="600" id='jeeFaceFilterCanvas'></canvas>
        <div id="controls" class="vidsize"></div>
    </div>
```

So `onload` calls the `initFilter()` method from the default filter at `public/filters/deform/deform.js` which sets up the canvas element to render the facefilter over webcam video. I created a naming convention the code uses to switch filters and it is:

`public/filters/filtername/filtername.js` and each filter has the same initFilter() method. When `loadFilter(filter)` is called it actually routes us to a completely different webpage:

```
function loadFilter(filter) {
	window.onbeforeunload = null;
  window.location = "/record?filter="+filter
```

And the filter is loaded through a query paramater:

`<script src='facefilter/filters/<%=filter%>/<%=filter%>.js'></script>`

Nothing is stopping you from doing away with this technique and swithching filters entirely in javascript, just some code refactoring would be necessary. 

And if you are wondering about the loading animated png...it displays by default on page load, and then is hidden by each of the four filters by calling

```
  $("#loading").hide();
} //end init_threeScene()
```

in `deform.js`

### Setup Kaltura Express Recorder

In `views/record.ejs` We use the [Kaltura Express Recorder](https://developer.kaltura.com/api-docs/Ingest_and_Upload_Media/express-recorder.html), which has the option to record a canvas element and combine it with your webcam's audio. 

 And `<div id="controls"` is where the [Kaltura Express Recorder](https://developer.kaltura.com/api-docs/Ingest_and_Upload_Media/express-recorder.html) controls will be injected. All of these elements must have the same video size to render properly. So now to instantiate the express recorder:

```javascript
			 const expressRec = Kaltura.ExpressRecorder.create('controls', {
            "ks": "<%=ks%>",
            "serviceUrl": "https://www.kaltura.com", // IE http://www.kaltura.com,
            "app": "APP_NAME",
            "playerUrl": "https://cdnapi.kaltura.com", // IE http://cdnapi.kaltura.com,
            "conversionProfileId": "CONVERSION_PROFILE_ID",
            "partnerId": <%=partnerId%>,
            "uiConfId": <%=playerId%>,
            "canvasId": "jeeFaceFilterCanvas"
        });
```

We have injected all relevant id strings from node,  and we specify the canvas to record via `canvasId` [Kaltura Express Recorder](https://developer.kaltura.com/api-docs/Ingest_and_Upload_Media/express-recorder.html) has many more configuration options and event listeners. 

We also make extensive use of the express recorder's event listener interface to help us create a better UX.

``` javascript
 				expressRec.instance.addEventListener("recordingStarted", (e) => {
            console.log(e.type);
            //hide the filter buttons when recording has started
            $('#filterRow').hide();
            $('#filterBtn').hide();
        });
        
        expressRec.instance.addEventListener("recordingCancelled", (e) => {
          	//if use hits cancel button, then show the filters again
            $('#filterBtn').show();
            console.log(e.type);   
        });

        expressRec.instance.addEventListener("mediaUploadEnded",(e) => {
           //once upload is finished, then move on to gallery
           window.onbeforeunload = null
           window.location="/gallery";
        });                  
```



You should see something like this: 

<img src="readme_images/FUNNY.png" alt="FUNNY" style="zoom:50%;" />

Go ahead and try a **Live Demo** which will upload to your [Kaltura Management Console](https://kmc.kaltura.com/index.php/kmcng/content/entries/list)

## The Gallery :

We are taking a very mvp approach to displaying the gallery with a simplifying assumption: this app will be the only source of videos connected to your account. If you want more control over how to organize videos, check out [Playlists](https://developer.kaltura.com/api-docs/service/playlist)

The express recorder creates a [Kaltura Media Entry](https://developer.kaltura.com/api-docs/General_Objects/Objects/KalturaMediaEntry) for your video and associates it with your user id. Our approach will simply list all media in our account via the [Media.list](https://developer.kaltura.com/console/service/media/action/list) api call 

### Kaltura Api Console

When you look at [Media.list](https://developer.kaltura.com/console/service/media/action/list) in the console: 

![MEDIALIST](readme_images/MEDIALIST.png)

On the left, we can send the request and add parameters to the request. Also pay close attention to the right side where you can choose from all supported languages to autogenerate sample code corresponding to the exact request on the left. 

And you will see...it is very close to what `gallery.js` is using:

```javascript
function getMedia(client) {
    return new Promise((resolve, reject) => {
        let filter = new kaltura.objects.MediaEntryFilter
        filter.orderBy = kaltura.enums.MediaEntryOrderBy.UPDATED_AT_DESC;
       
        let pager = new kaltura.objects.FilterPager();
        pager.pageSize = 500;
        kaltura.services.media
            .listAction(filter, pager)
            .execute(client)
            .then(response => {
                resolve(response);
            });
    });
}
```

### Animated thumbnails

We are using https://github.com/kaltura/VideoThumbnailAnimator in `views/gallery.ejs` to provide animted thumbnails for the gallery

```html
    <div id="thumbnails">
        <%- include('gallery/entries.ejs', {entries: entries}) %>
    </div>
    <script>
        var thumbAnimator = new KalturaThumbAnimator();
        thumbAnimator.setup("videothumbnail", "http://cfvod.kaltura.com", 0, true); 
    </script>
```



## User Page

### Querying for user's Kaltura Media Entries

To display a users videos, We are using [Media.list](https://developer.kaltura.com/console/service/media/action/list) again with one extra step: filtering by userId.

and you can build this query using the Api Console:

```javascript
let filter = new kaltura.objects.MediaEntryFilter
filter.orderBy = kaltura.enums.MediaEntryOrderBy.UPDATED_AT_DESC;
filter.userIdEqual = userId;
let pager = new kaltura.objects.FilterPager();
pager.pageSize = 500;
kaltura.services.media.listAction(filter, pager)
    .execute(client)
    .then(response => {
        resolve(response);
    });
```

### Playing Video

in `views/user.ejs`

We will be following the steps to set up a player from https://developer.kaltura.com/player/web/getting-started-web 

```javascript
<script type="text/javascript" 
src="https://cdnapisec.kaltura.com/p/<%=partnerId %>/embedPlaykitJs/uiconf_id/<%=playerId%>">
</script>
    <script type="text/javascript">
        try {
            var player = KalturaPlayer.setup({
                targetId: "playerContainer",
                provider: {
                partnerId: <%= partnerId %>,
                uiConfId: <%= playerId %>
                }
            });
        player.loadMedia({ entryId: '<%= entries[0].id %>' });
        } catch (e) {
            console.error(e.message)
        }
    </script>
```



And in `routes/user/post.ejs` we load the player with:

`<a href="#" onclick="player.loadMedia({entryId: '<%= entry.id %>'})"><img src="<%= entry.thumbnailUrl %>"></a>`

## Wrapping Up

My intention is that you were inspired to see how easy it can be to create a facefilter based application using the Kaltura VPaaS api and its extensive documentation. 

# How you can help (guidelines for contributors)

Thank you for helping Kaltura grow! If you'd like to contribute please follow these steps:

- Use the repository issues tracker to report bugs or feature requests
- Read [Contributing Code to the Kaltura Platform](https://github.com/kaltura/platform-install-packages/blob/master/doc/Contributing-to-the-Kaltura-Platform.md)
- Sign the [Kaltura Contributor License Agreement](https://agentcontribs.kaltura.org/)

# Where to get help

- Join the [Kaltura Community Forums](https://forum.kaltura.org/) to ask questions or start discussions
- Read the [Code of conduct](https://forum.kaltura.org/faq) and be patient and respectful

# Get in touch

You can learn more about Kaltura and start a free trial at: [http://corp.kaltura.com](http://corp.kaltura.com/)
Contact us via Twitter [@Kaltura_API](https://twitter.com/Kaltura_API) or email: [community@kaltura.com](mailto:community@kaltura.com)
We'd love to hear from you!

# License and Copyright Information

All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.

Copyright © Kaltura Inc. All rights reserved.

### Open Source Libraries Used:

https://github.com/jeeliz/jeelizFaceFilter 

