var express = require('express');
var router = express.Router();

router.get('/', async (req, res, next) => {
  const { ks } = req.session;
  const { PLAYER_ID: playerId, PARTNER_ID: partnerId } = process.env;
  var filter = req.query.filter;
  if(!filter) {
    filter = "deform";
  }
  try {
    res.render('record', {
      ks,
      playerId,
      partnerId,
      filter
    });
  } catch (e) {
    res.render('error', { message: e.message, error: { status: 500, stack: '' } });
  }
});

module.exports = router;