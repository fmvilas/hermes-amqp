# hermesjs-amqp

AMQP adapter for [HermesJS](https://github.com/fmvilas/hermes).

## Installing

```
npm install hermesjs-amqp
```

## Example

```js
const Hermes = require('hermesjs');
const AmqpAdapter = require('hermesjs-amqp');

const app = new Hermes();

app.addAdapter(AmqpAdapter, {
  topics: ['trip.requested', 'trip.changed'],
  exchange: 'test',
});
```

See a working example [here](./example/index.js).

## Author

Fran Méndez ([fmvilas.com](https://fmvilas.com))
