const kaltura = require('kaltura-client');

const {ADMIN_SECRET: secret, PARTNER_ID: partnerId, KS_TYPE: ksType, SERVICE_URL: serviceUrl} = process.env;
let config = new kaltura.Configuration();
config.serviceUrl = serviceUrl;

const defaultKSType = kaltura.enums.SessionType[ksType || 'USER'];

class KalturaClientFactory {
    static getKS(userId, options = null) {
        const { type = defaultKSType, privileges = ''} = options || {};
        var client = new kaltura.Client(config);
        var expiry = null;

        return new Promise((resolve, reject) => {
          kaltura.services.session.start(secret, userId, type, partnerId, expiry, privileges)
            .completion((success, response) => {
              if (!success) {
                console.log('Session initiation Failed.');
                reject(response.message);
                return;
              }
              resolve(response);
            })
            .execute(client);
        });
    }

    static getClient(ks) {
        var client = new kaltura.Client(config);
        client.setKs(ks);
        return Promise.resolve(client);
    }
}

module.exports = KalturaClientFactory;
