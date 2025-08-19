import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      username: string;
    };
    user: {
      id: string;
      email: string;
      username: string;
    };
  }
}

async function authPlugin(app: FastifyInstance) {
  const jwtSecret = process.env['JWT_SECRET'] || 'demo-secret-key-for-development-only';
  
  if (jwtSecret === 'demo-secret-key-for-development-only') {
    app.log.warn('Using default JWT secret - NOT FOR PRODUCTION USE');
  }

  await app.register(fastifyJwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '24h',
    },
  });

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Unauthorized',
      });
    }
  });
}

export default fp(authPlugin, {
  name: 'auth-plugin',
});