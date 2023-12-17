const express = require('express');
const pino = require('pino');
const eventsModule = require('./events');
const alertsModule = require('./alerts');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());
app.use(require('express-pino-logger')({ logger }));

const port = process.env.PORT || 3000;

const loadData = require('./data.json');
const thresholds = loadData.thresholds;
const lastAlertTimes = loadData.lastAlertTimes;

app.post('/event', async (req, res) => {
  try {
    const event = req.body;
    await eventsModule.validateAndStoreEvent(event);
    eventsModule.cleanupOldEvents();
    res.status(201).send({ message: 'Event received', eventId: eventsModule.getEventCount() });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ message: error.message });
  }
});

app.get('/alert/:alertId', async (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId, 10);
    const alert = await alertsModule.getAlertById(alertId);
    if (alert) {
      res.send(alert);
    } else {
      res.status(404).send({ message: 'Alert not found' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

const checkForViolations = async () => {
  const alertsGenerated = await alertsModule.checkForViolations(thresholds, lastAlertTimes);
  if (alertsGenerated.length > 0) {
    logger.info('Generated new alerts:', alertsGenerated);
    eventsModule.saveData({ ...loadData, lastAlertTimes: alertsModule.updateLastAlertTimes(alertsGenerated) });
  }
};

setInterval(checkForViolations, 5 * 60000);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
