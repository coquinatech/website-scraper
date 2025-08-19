import bcrypt from 'bcrypt';
import { eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, type User, type InsertUser } from '../db/schema/users.js';
import type { FastifyInstance } from 'fastify';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0] || null;
  }

  async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername),
          eq(users.username, emailOrUsername)
        )
      )
      .limit(1);
    
    return result[0] || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async createUser(data: RegisterData): Promise<User> {
    const passwordHash = await this.hashPassword(data.password);
    
    const newUser: InsertUser = {
      email: data.email,
      username: data.username,
      passwordHash,
      isActive: true,
    };

    const result = await db
      .insert(users)
      .values(newUser)
      .returning();
    
    return result[0]!;
  }

  async login(credentials: AuthCredentials): Promise<{ user: User; token: string } | null> {
    const user = await this.findUserByEmailOrUsername(credentials.email);
    
    if (!user) {
      this.app.log.warn({ email: credentials.email }, 'Login attempt for non-existent user');
      return null;
    }

    if (!user.isActive) {
      this.app.log.warn({ email: credentials.email }, 'Login attempt for inactive user');
      return null;
    }

    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
    
    if (!isValidPassword) {
      this.app.log.warn({ email: credentials.email }, 'Login attempt with invalid password');
      return null;
    }

    const token = this.app.jwt.sign(
      { 
        id: user.id,
        email: user.email,
        username: user.username 
      },
      { expiresIn: '24h' }
    );

    this.app.log.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return { user, token };
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const existingUser = await this.findUserByEmailOrUsername(data.email);
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await this.findUserByEmailOrUsername(data.username);
    
    if (existingUsername) {
      throw new Error('User with this username already exists');
    }

    const user = await this.createUser(data);

    const token = this.app.jwt.sign(
      { 
        id: user.id,
        email: user.email,
        username: user.username 
      },
      { expiresIn: '24h' }
    );

    this.app.log.info({ userId: user.id, email: user.email }, 'User registered successfully');

    return { user, token };
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}