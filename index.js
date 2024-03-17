//@ts-check 
require('./utils/preload');
const app = require('./api/app');

if (require.main === module) {
  const start = async () => {
    const server = await app();
    const gracefulExit = async (signal) => {
      console.log(`=> Received signal to terminate: ${signal}`);
      try {
        await server.close();
      } catch (err) {
        console.log(err);
      } finally {
        process.kill(process.pid, signal);
      }
    }

    process.once('SIGINT', gracefulExit);
    process.once('SIGTERM', gracefulExit);

    await server.listen({ host: '0.0.0.0', port: 3000 });
    await server.ready();
  }

  start();

} else {
  module.exports = app;
}
