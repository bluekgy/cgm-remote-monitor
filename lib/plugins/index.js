'use strict';

var _ = require('lodash');

function init() {

  var allPlugins = []
    , enabledPlugins = [];

  function plugins(name) {
    if (name) {
      return _.find(allPlugins, {name: name});
    } else {
      return plugins;
    }
  }

  plugins.base = require('./pluginbase');

  var clientDefaultPlugins = [
    require('./rawbg')()
    , require('./delta')()
    , require('./direction')()
    , require('./timeago')()
    , require('./upbat')()
    , require('./ar2')()
    , require('./errorcodes')()
    , require('./iob')()
    , require('./cob')()
    , require('./careportal')()
    , require('./pump')()
    , require('./openaps')()
    , require('./boluswizardpreview')()
    , require('./cannulaage')()
    , require('./sensorage')()
    , require('./insulinage')()
    , require('./basalprofile')()
    , require('./boluscalc')()  // fake plugin to show/hide
    , require('./profile')()    // fake plugin to hold extended settings
  ];

  var serverDefaultPlugins = [
    require('./rawbg')()
    , require('./delta')()
    , require('./direction')()
    , require('./ar2')()
    , require('./simplealarms')()
    , require('./errorcodes')()
    , require('./iob')()
    , require('./cob')()
    , require('./pump')()
    , require('./openaps')()
    , require('./boluswizardpreview')()
    , require('./cannulaage')()
    , require('./sensorage')()
    , require('./insulinage')()
    , require('./treatmentnotify')()
    , require('./timeago')()
  ];

  plugins.registerServerDefaults = function registerServerDefaults() {
    plugins.register(serverDefaultPlugins);
    return plugins;
  };

  plugins.registerClientDefaults = function registerClientDefaults() {
    plugins.register(clientDefaultPlugins);
    return plugins;
  };

  plugins.register = function register(all) {
    _.each(all, function eachPlugin(plugin) {
      allPlugins.push(plugin);
    });
  };

  plugins.init = function initPlugins (settings) {
    enabledPlugins = [];
    function isEnabled(plugin) {
      //TODO: unify client/server env/app
      return settings.enable.indexOf(plugin.name) > -1;
    }

    _.each(allPlugins, function eachPlugin(plugin) {
      plugin.enabled = isEnabled(plugin);
      if (plugin.enabled) {
        enabledPlugins.push(plugin);
      }
    });
    return plugins;
  };

  plugins.eachPlugin = function eachPlugin(f) {
    _.each(allPlugins, f);
  };

  plugins.eachEnabledPlugin = function eachEnabledPlugin(f) {
    _.each(enabledPlugins, f);
  };

  //these plugins are either always on or have custom settings
  plugins.specialPlugins = 'ar2 delta direction timeago upbat rawbg errorcodes profile';

  plugins.shownPlugins = function(sbx) {
    return _.filter(enabledPlugins, function filterPlugins(plugin) {
      return plugins.specialPlugins.indexOf(plugin.name) > -1 || (sbx && sbx.showPlugins && sbx.showPlugins.indexOf(plugin.name) > -1);
    });
  };

  plugins.eachShownPlugins = function eachShownPlugins(sbx, f) {
    _.each(plugins.shownPlugins(sbx), f);
  };

  plugins.hasShownType = function hasShownType(pluginType, sbx) {
    return _.find(plugins.shownPlugins(sbx), function findWithType(plugin) {
      return plugin.pluginType === pluginType;
    }) !== undefined;
  };

  plugins.setProperties = function setProperties(sbx) {
    plugins.eachEnabledPlugin(function eachPlugin (plugin) {
      if (plugin.setProperties) {
        plugin.setProperties(sbx.withExtendedSettings(plugin));
      }
    });
  };

  plugins.checkNotifications = function checkNotifications(sbx) {
    plugins.eachEnabledPlugin(function eachPlugin (plugin) {
      if (plugin.checkNotifications) {
        plugin.checkNotifications(sbx.withExtendedSettings(plugin));
      }
    });
  };

  plugins.updateVisualisations = function updateVisualisations(sbx) {
    plugins.eachShownPlugins(sbx, function eachPlugin(plugin) {
      if (plugin.updateVisualisation) {
        plugin.updateVisualisation(sbx.withExtendedSettings(plugin));
      }
    });
  };

  plugins.getAllEventTypes = function getAllEventTypes(sbx) {
    var all = [];
    plugins.eachEnabledPlugin(function eachPlugin(plugin) {
      if (plugin.getEventTypes) {
        var eventTypes = plugin.getEventTypes(sbx.withExtendedSettings(plugin));
        if (_.isArray(eventTypes)) {
          all = all.concat(eventTypes);
        }
      }
    });

    return all;
  };

  plugins.enabledPluginNames = function enabledPluginNames() {
    return _.map(enabledPlugins, function mapped(plugin) {
      return plugin.name;
    }).join(' ');
  };

  plugins.extendedClientSettings = function extendedClientSettings (allExtendedSettings) {
    var clientSettings = {};
    _.each(clientDefaultPlugins, function eachClientPlugin (plugin) {
      clientSettings[plugin.name] = allExtendedSettings[plugin.name];
    });

    //HACK:  include devicestatus
    clientSettings.devicestatus = allExtendedSettings.devicestatus;

    return clientSettings;
  };

  return plugins();

}

module.exports = init;