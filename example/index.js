const Hermes = require('hermesjs');
const AmqpAdapter = require('..');

const hermes = new Hermes();

hermes.addAdapter(AmqpAdapter, {
  exchange: 'test',
  exchangeOptions: { durable: true },
  topics: ['trip.changed', 'trip.requested'],
});

hermes.use('trip/:event', (message, next) => {
  console.log('Trip has been', message.params.event, 'with info:', message.payload);
  next();
});

hermes.use((err, message, next) => {
  console.log('ERROR', err);
  next();
});

hermes
  .listen()
  .then((adapter) => {
    console.log('Connected');
  })
  .catch(console.error);
