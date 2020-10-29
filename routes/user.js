var kaltura = require("kaltura-client");
var express = require("express");
var router = express.Router();
var KalturaClientFactory = require("../lib/kalturaClientFactory");

function getMedia(client,userId) {
    return new Promise((resolve, reject) => {
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
    });
}

router.get("/", async (req, res, next) => {
    var ks = await KalturaClientFactory.getKS("", { type: kaltura.enums.SessionType.ADMIN });
    var client = await KalturaClientFactory.getClient(ks);
    var userId = req.query.userId;
    var entries = await getMedia(client,userId);
    entries = entries.objects;
    const { PARTNER_ID: partnerId,PLAYER_ID: playerId } = process.env;
    res.render("user", { entries,partnerId,playerId,userId});
});

module.exports = router;
