import bcrypt from 'bcrypt';
import { User, Role } from '../models/User';

const users: User[] = [];
let currentId = 1;

export const createUser = async (email: string, password: string, role: Role): Promise<User> => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id: currentId++, email, passwordHash, role };
  users.push(user);
  return user;
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find(u => u.email === email);
};

export const verifyPassword = async (user: User, password: string): Promise<boolean> => {
  return bcrypt.compare(password, user.passwordHash);
};
