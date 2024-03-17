//@ts-check
const Fastify = require('fastify').default;
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const helmet = require('@fastify/helmet').default;
const fastifyFormBody = require('@fastify/formbody').default;
const routes = require('./routes');
const UserError = require('../utils/userError');
const app = Fastify({ logger: true });

module.exports = async () => {
  app.register(helmet, { global: true });
  app.register(cors);

  app.setErrorHandler(function (error, request, reply) {
    this.log.error(error);
    const status = error.statusCode;
    if (error instanceof UserError) {
      return reply.status(400).send({ message: error.message });
    } else if (!status || status >= 500) {
      return reply.status(500).send({ message: 'Server Error!' });
    }
    return reply.status(status).send(error.message);
  });

  await app.register(fastifyFormBody);
  await app.register(jwt, {
    secret: process.env.SECRET_JWT || 'idk',
    verify: { extractToken: (req) => req.headers.token }
  });

  app.register(routes);

  return app;
}
