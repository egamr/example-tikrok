var express = require('express');
var router = express.Router();
var kaltura = require('kaltura-client');
var KalturaClientFactory = require('../lib/kalturaClientFactory');

/* GET home page. */
router.get('/', function(req, res, next) {
  req.session = null;
  res.render('login', { errorMessage: ''});
});

router.post('/', async (req, res, next) => {
  try {
    var adminks = await KalturaClientFactory.getKS('', {type: kaltura.enums.SessionType.ADMIN});
    var client = await KalturaClientFactory.getClient(adminks);
    var user = await getOrCreateUser(client, req.body.userId);
    var userKs = await KalturaClientFactory.getKS(user.id,{privileges: 'editadmintags:*'});
    req.session.ks = userKs;

    res.redirect(`/gallery`);
  }catch (e) {
    res.render('error', { message: e,error:e});
  }
});

function getUser(client,userId) {
  return new Promise((resolve, reject) => {
    kaltura.services.user.get(userId)
      .completion((success, response) => {
        if (!success) {
          console.log("User doesn't exist");
          resolve(null);
        } else {
          console.log("User Exists");
          resolve(response);
        }
      })
      .execute(client);
  });
}

function createUser(client, userId) {
  return new Promise((resolve, reject) => {
    let user = new kaltura.objects.User();
    user.id = userId;
    kaltura.services.user.add(user)
      .completion((success, response) => {
        if (success) {
          console.log("User Created");
          resolve(response);
        } else {
          console.log("Could not create user");
          reject(response.message);
        }
      })
      .execute(client)
  });
}

function getOrCreateUser(client, userId) {
  return getUser(client, userId).then((user) => {
    if (user) {
      return user;
    } else {
      return createUser(client, userId).then((user) => {
        if (user) {
          return user;
        }
      });
    }
  })
}



module.exports = router;
