import crypto from 'node:crypto';
import * as db from '../services/db.js';

export async function createUser(userData) {
  const existingUser = db.users.find(
    (u) =>
      u.email === userData.email || u.phone_number === userData.phone_number,
  );
  if (existingUser) {
    throw new Error('Пользователь с такой почтой или телефоном уже существует');
  }
  // для облегчения взаимодействия с тестами
  const roleCode = userData.role || 'user';
  const newUser = {
    id: crypto.randomUUID(),
    first_name: userData.first_name,
    middle_name: userData.middle_name || null,
    last_name: userData.last_name,
    phone_number: userData.phone_number,
    email: userData.email || null,
    social_media: userData.social_media || null,
    password: `hashed_${userData.password}`,
    roles: [db.ROLES[roleCode] || db.ROLES.user],
    study_group: userData.study_group || null,
    avatar_url: null,
  };
  db.users.push(newUser);
  return newUser;
}

export async function findUserBy(criteria) {
  if (criteria.id) return db.users.find((u) => u.id === criteria.id);
  if (criteria.email) return db.users.find((u) => u.email === criteria.email);
  if (criteria.token) {
    const userId = db.tokens.get(criteria.token);
    if (!userId) return null;
    return db.users.find((u) => u.id === userId);
  }
  return null;
}

export async function updateUser(userId, updates) {
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  const allowedFields = [
    'first_name',
    'middle_name',
    'last_name',
    'phone_number',
    'email',
    'social_media',
    'study_group',
    'avatar_url',
  ];
  const filteredUpdates = {};

  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  }

  const updatedUser = { ...db.users[userIndex], ...filteredUpdates };
  db.users[userIndex] = updatedUser;
  return updatedUser;
}

export async function updateAvatar(userId, avatarUrl) {
  return updateUser(userId, { avatar_url: avatarUrl });
}

export async function authenticateUser(email, password) {
  const user = await findUserBy({ email });
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export function generateTokenForUser(userId) {
  const token = crypto.randomUUID();
  db.tokens.set(token, userId);
  return token;
}

export function invalidateToken(token) {
  db.tokens.delete(token);
}

export async function assignRole(userId, roleName) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('Пользователь не найден');

  const validRoles = ['user', 'psychologist', 'admin', 'content_manager'];
  if (!validRoles.includes(roleName)) throw new Error('Недопустимая роль');

  if (!user.roles) {
    user.roles = [];
  }

  const alreadyHasRole = user.roles.some((r) => r.code === roleName);
  if (!alreadyHasRole) {
    user.roles.push(db.ROLES[roleName]);
  }

  return user;
}

export async function removeRole(userId, roleName) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('Пользователь не найден');

  if (!user.roles) {
    user.roles = [];
  }

  const roleIndex = user.roles.findIndex((r) => r.code === roleName);
  if (roleIndex === -1) throw new Error('Роль не найдена у пользователя');

  user.roles.splice(roleIndex, 1);
  return user;
}

export async function createPsychologist(data) {
  const newTherapist = {
    id: crypto.randomUUID(),
    ...data,
  };
  db.therapists.push(newTherapist);
  return newTherapist;
}

export async function deletePsychologist(id) {
  const index = db.therapists.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Психолог не найден');
  db.therapists.splice(index, 1);
  return { success: true };
}
