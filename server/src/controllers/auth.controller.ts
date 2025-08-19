import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

let authService: AuthService;

export function initAuthController(app: FastifyInstance) {
  authService = new AuthService(app);
}

export async function login(
  request: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>,
  reply: FastifyReply
) {
  try {
    const { email, password } = loginSchema.parse(request.body);

    const result = await authService.login({ email, password });

    if (!result) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const sanitizedUser = authService.sanitizeUser(result.user);

    return reply.send({
      success: true,
      message: 'Login successful',
      user: sanitizedUser,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    request.log.error(error, 'Login failed');
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function register(
  request: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>,
  reply: FastifyReply
) {
  try {
    const { username, email, password } = registerSchema.parse(request.body);

    const result = await authService.register({ email, username, password });
    const sanitizedUser = authService.sanitizeUser(result.user);

    return reply.status(201).send({
      success: true,
      message: 'User registered successfully',
      user: sanitizedUser,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return reply.status(409).send({
        success: false,
        message: error.message,
      });
    }

    request.log.error(error, 'Registration failed');
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
}