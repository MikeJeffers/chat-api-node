//@ts-check
const S = require('fluent-json-schema').default;
const bcrypt = require('bcrypt');
const Redis = require('./redis');
const USER = require('./user');

/**
 * @typedef {import('fastify').FastifyRequest} Request
 * @typedef {import('fastify').FastifyReply} Response
 */

/**
 * @typedef {import('fastify').RouteHandler} Handler
 */

const registerValidator = S.object()
  .prop('password', S.string().minLength(4).maxLength(64))
  .prop('username', S.string().minLength(4).maxLength(64));

const loginValidator = S.object()
  .prop('username', S.string().minLength(4).maxLength(64))
  .prop('password', S.string().minLength(4).maxLength(64));



/**
 * @param {import('fastify').FastifyReply} res 
 * @param {{"id":number,"username":string}} payload 
 * @returns {Promise<string>} token
 */
const signToken = async (res, payload) => {
  const token = await res.jwtSign(Object.assign({}, payload), { expiresIn: 3600, algorithm: 'HS256' });
  await Redis.set(`jwt:${payload.id}`, token, 'EX', 3600);
  return token;
}

/**
 * 
 * @param {string} pass plaintext password
 * @returns {Promise<string>} hashed and salted 
 */
const hashPass = async (pass) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pass, salt);
}

/** @type {import('fastify').RouteHandler} */
const registerHandler = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    throw { statusCode: 400, message: "bad request" }
  }
  const { username, password } = req.body;

  if (await USER.getByUsername(username)) {
    throw { statusCode: 400, message: "Username must be unique" }
  }

  const encryptedPwd = await hashPass(password);
  const user = await USER.createUser({ username, password: encryptedPwd });
  const token = await signToken(res, { id: user.id, username: user.username });
  return res.status(200).send({ token, user: { id: user.id, username: user.username } });
};



/** @type {import('fastify').RouteHandler} */
const loginHandler = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    throw { statusCode: 400, message: "bad request" };
  }
  const { username, password } = req.body;
  let user = await USER.getByUsername(username);
  if (!user) {
    throw { statusCode: 400, message: "Provided username and/or password is incorrect" }
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { statusCode: 400, message: "Provided username and/or password is incorrect" }
  }

  const payload = {
    user: {
      id: user.id
    }
  };

  const token = await signToken(res, payload);

  return res.status(200).send({ token, user: { id: user.id, username: user.username } });
};
/**
 * @param {import('fastify').FastifyInstance} fastify 
 */
module.exports = async (fastify) => {
  fastify.post('/register', { schema: { body: registerValidator } }, registerHandler);
  fastify.post('/login', { schema: { body: loginValidator } }, loginHandler);
};