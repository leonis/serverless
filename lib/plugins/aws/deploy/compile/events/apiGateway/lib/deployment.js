'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileDeployment() {
    this.apiGatewayDeploymentLogicalId = this.provider.naming
      .generateApiGatewayDeploymentLogicalId();

    const _this = this;
    _this.cacheClusterEnabled = false;
    _this.cacheClusterSize = 0.5;
    _this.cachingEnabled = false;
    _this.cacheTtlInSeconds = 300;
    _this.cacheDataEncrypted = false;
    _this.methodSettings = {
      "*/*/caching/enabled": _this.cachingEnabled,
      "*/*/caching/ttlInSeconds": _this.cacheTtlInSeconds,
      "*/*/caching/dataEncrypted": _this.cacheDataEncrypted
    };
    _.each(this.serverless.service.functions, (fvalue, fkey) => {
      const func = _this.serverless.service.functions[fkey];
      _.each(func.events, (esvalue, eskey) => {
        _.each(func.events[eskey], (evalue, ekey) => {
          if (ekey === "stage") {
            if (evalue.cacheClusterEnabled) {
              _this.cacheClusterEnabled = evalue.cacheClusterEnabled;
            }
            if (evalue.cacheClusterSize) {
              _this.cacheClusterSize = evalue.cacheClusterSize;
            }
          } else if (ekey === "http") {
            if (evalue.cachingEnabled) {
              _this.methodSettings[`${evalue.path}/${evalue.method.toUpperCase()}/caching/enabled`] = evalue.cachingEnabled;
            }
            if (evalue.cacheTtlInSeconds) {
              _this.methodSettings[`${evalue.path}/${evalue.method.toUpperCase()}/caching/ttlInSeconds`] = evalue.cacheTtlInSeconds;
            }
            if (evalue.cacheDataEncrypted) {
              _this.methodSettings[`${evalue.path}/${evalue.method.toUpperCase()}/caching/dataEncrypted`] = evalue.cacheDataEncrypted;
            }
          }
        });
      });
    });

    // create CLF Output for endpoint
    _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Outputs, {
      ServiceEndpoint: {
        Description: 'URL of the service endpoint',
        Value: {
          'Fn::Join': ['',
            [
              'https://',
              { Ref: this.apiGatewayRestApiLogicalId },
              `.execute-api.${this.options.region}.amazonaws.com/${this.options.stage}`,
            ],
          ],
        },
      },
    });
    return BbPromise.resolve();
  },
};
