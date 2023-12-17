const fs = require('fs');
const dataFilePath = './data.json';
let loadData = require(dataFilePath);

let events = []; // Replace with data access/persistence logic

function validateAndStoreEvent(event) {
  // Check if event object is valid and has required fields with correct types
  if (!event 
      || typeof event.timestamp !== 'string' 
      || typeof event.is_driving_safe !== 'boolean' 
      || !event.vehicle_id 
      || typeof event.location_type !== 'string') {
    throw new Error('Invalid event data');
  }
  events.push(event);
  saveData({ ...loadData, events });
}


function getEventCount() {
  return events.length;
}

function cleanupOldEvents() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - (5 * 60000));
  events = events.filter(e => new Date(e.timestamp) > fiveMinutesAgo);
  saveData({ ...loadData, events });
}

function saveData(data) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
      loadData = data; // Update the in-memory data
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }
  
module.exports = {
  validateAndStoreEvent,
  getEventCount,
  cleanupOldEvents,
  saveData
};
