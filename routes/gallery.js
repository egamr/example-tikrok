var kaltura = require("kaltura-client");
var express = require("express");
var router = express.Router();
var KalturaClientFactory = require("../lib/kalturaClientFactory");

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

router.get("/", async (req, res, next) => {
    var ks = await KalturaClientFactory.getKS("", { type: kaltura.enums.SessionType.ADMIN });
    var client = await KalturaClientFactory.getClient(ks);
    
    var entries = await getMedia(client);
    entries = entries.objects;
    const { PARTNER_ID: partnerId } = process.env;
    res.render("gallery", { entries,partnerId });
});
router.post('/', async (req, res, next) => {
    try {
      var adminks = await KalturaClientFactory.getKS('', {type: kaltura.enums.SessionType.ADMIN});
      var client = await KalturaClientFactory.getClient(adminks);
      var user = await getOrCreateUser(client, req.body.userId);
      var userKs = await KalturaClientFactory.getKS(user.id,{privileges: 'editadmintags:*'});

      let id = req.body.mediaId;
      kaltura.services.playlist.deleteAction(id)
      .execute(client)
      .then(result => {
          console.log(result);
      });
    }catch (e) {
      res.render('error', { message: e,error:e});
    }
  });

module.exports = router;
