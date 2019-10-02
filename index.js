const amqp = require('amqplib');
const { Adapter, Message } = require('hermesjs');

class AmqpAdapter extends Adapter {
  name () {
    return 'AMQP adapter'
  }

  async connect () {
    return this._connect();
  }

  async send (message, options) {
    return this._send(message, options);
  }

  _connect () {
    return new Promise((resolve, reject) => {
      let resolved = false;

      this.options = this.options || {};
      this.options.protocol = this.options.protocol || 'amqp';
      this.options.hostname = this.options.hostname || 'localhost';
      this.options.port = this.options.port || 5672;
      this.options.username = this.options.username || 'guest';
      this.options.password = this.options.password || 'guest';
      this.options.password = this.options.password || 'guest';
      this.options.locale = this.options.locale || 'en_US';
      this.options.frameMax = this.options.frameMax || 0;
      this.options.heartbeat = this.options.heartbeat || 0;
      this.options.vhost = this.options.vhost || '/';
      this.options.exchange = this.options.exchangeOptions || 'amq.topic';
      this.options.exchangeOptions = this.options.exchangeOptions || {};
      this.options.queue = this.options.queue || '';
      this.options.queueOptions = this.options.queueOptions || {};
      this.options.topics = this.options.topics || ['*'];
      this.options.consumerOptions = this.options.consumerOptions || {};

      const open = amqp.connect(this.options);

      const catchError = error => {
        if (!resolved) reject(error);
        this.emit('error', error);
      };

      open.then(conn => {
        process.once('SIGINT', () => { conn.close(); });

        return conn.createChannel().then(ch => {
          const ex = this.options.exchange;
          let ok = ch.assertExchange(ex, 'topic', this.options.exchangeOptions);

          ok = ok.then(() => {
            return ch.assertQueue(this.options.queue, this.options.queueOptions);
          }).catch(catchError);

          ok = ok.then(qok => {
            const queue = qok.queue;
            return Promise.all(this.options.topics.map(rk => {
              ch.bindQueue(queue, ex, rk);
            })).then(() => { return queue; }).catch(catchError);
          });

          ok = ok.then(queue => {
            return ch.consume(queue, message => {
              const msg = this._createMessage(message);
              this.emit('message', msg);
            }, this.options.consumerOptions);
          }).catch(catchError);

          resolve(this);
          resolved = true;
        }).catch(catchError);
      })
      .catch(catchError);
    });
  }

  _send (message) {
    return new Promise((resolve, reject) => {
      amqp.connect(this.options).then(conn => {
        return conn.createChannel().then(ch => {
          const ex = this.options.exchange;
          let ok = ch.assertExchange(ex, 'topic', this.options.exchangeOptions);
          return ok.then(() => {
            ch.publish(ex, this.translateHermesRoute(message.topic), Buffer.from(message.payload));
            resolve();
            return ch.close();
          });
        }).finally(() => { conn.close(); })
      }).catch(err => {
        reject(err);
      });
    });
  }

  _createMessage (msg) {
    const headers = {
      ...msg.fields,
      ...msg.properties,
    };

    return new Message(this.hermes, msg.content.toString(), headers, this.translateRoutingKey(msg.fields.routingKey));
  }

  translateRoutingKey (rk) {
    return rk.replace(/\./g, '/');
  }

  translateHermesRoute (route) {
    return route.replace(/\//g, '.');
  }
}

module.exports = AmqpAdapter;
