import jsonServer from 'json-server';
import { readFileSync } from 'fs';

const routes = JSON.parse(readFileSync('./routes.json', 'utf-8'));

const server = jsonServer.create();
server.set('etag', false);
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.rewriter(routes));

server.use((req, res, next) => {
  const originalJsonp = res.jsonp;
  res.jsonp = function (data) {
    return originalJsonp.call(this, {
      success: true,
      data,
      message: '요청 성공',
    });
  };
  next();
});

server.use(router);
server.listen(3000, () => {
  console.log('JSON Server running at http://localhost:3000');
});
