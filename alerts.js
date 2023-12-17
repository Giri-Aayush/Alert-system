const dataFilePath = './data.json';
let loadData = require(dataFilePath);

function checkForViolations(thresholds, lastAlertTimes) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - (5 * 60000));
  const recentEvents = loadData.events.filter(e => new Date(e.timestamp) > fiveMinutesAgo);

  const alertsGenerated = [];

  Object.keys(thresholds).forEach(locationType => {
    const locationEvents = recentEvents.filter(e => e.location_type === locationType);
    const unsafeEvents = locationEvents.filter(e => !e.is_driving_safe);

    if (unsafeEvents.length >= thresholds[locationType]) {
      if (!lastAlertTimes[locationType] || new Date(lastAlertTimes[locationType]) <= fiveMinutesAgo) {
        const newAlert = {
          id: loadData.alerts.length + 1,
          timestamp: now.toISOString(),
          locationType: locationType,
          count: unsafeEvents.length
        };
        loadData.alerts.push(newAlert);
        lastAlertTimes[locationType] = now.toISOString();
        alertsGenerated.push(newAlert);
      }
    }
  });

  saveData(loadData); // Save the updated data
  return alertsGenerated;
}

function getAlertById(alertId) {
  return loadData.alerts.find(alert => alert.id === alertId);
}

function updateLastAlertTimes(alerts) {
  alerts.forEach(alert => {
    loadData.lastAlertTimes[alert.locationType] = alert.timestamp;
  });
  return loadData.lastAlertTimes;
}

function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  loadData = data; // Update the in-memory data
}

module.exports = {
  checkForViolations,
  getAlertById,
  updateLastAlertTimes
};
