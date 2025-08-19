import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
});

let authService: AuthService;

export function initUserController(app: FastifyInstance) {
  authService = new AuthService(app);
}

export async function getProfile(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    
    const user = await authService.findUserById(userId);
    
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const sanitizedUser = authService.sanitizeUser(user);

    return reply.send({
      success: true,
      user: sanitizedUser,
    });
  } catch (error) {
    request.log.error(error, 'Failed to get user profile');
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function updateProfile(
  request: FastifyRequest<{ Body: z.infer<typeof updateProfileSchema> }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const updates = updateProfileSchema.parse(request.body);
    
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'No updates provided',
      });
    }

    if (updates.email) {
      const existingUser = await authService.findUserByEmail(updates.email);
      if (existingUser && existingUser.id !== userId) {
        return reply.status(409).send({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    if (updates.username) {
      const existingUser = await authService.findUserByEmailOrUsername(updates.username);
      if (existingUser && existingUser.id !== userId) {
        return reply.status(409).send({
          success: false,
          message: 'Username already in use',
        });
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return reply.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const sanitizedUser = authService.sanitizeUser(updatedUser);

    return reply.send({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    request.log.error(error, 'Failed to update user profile');
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
}