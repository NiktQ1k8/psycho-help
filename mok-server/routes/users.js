import { Router } from 'express';
import { isAuthenticated } from '../lib/auth.js';
import {
  authenticateUser,
  createPsychologist,
  createUser,
  deletePsychologist,
  findUserBy,
  generateTokenForUser,
  invalidateToken,
  updateAvatar,
  updateUser,
} from '../services/user.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ detail: 'Not authenticated' });
  const userRoleCodes = (req.user.roles || []).map((r) => r.code);
  if (!userRoleCodes.includes('admin')) {
    return res.status(403).json({ detail: 'Недостаточно прав' });
  }
  next();
}

router.post('/register', async (req, res) => {
  try {
    const user = await createUser(req.body);
    const token = generateTokenForUser(user.id);
    res.cookie('access_token', token, { httpOnly: true, secure: false });
    const { password, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(422).json({ detail: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }
  const token = generateTokenForUser(user.id);
  res.cookie('access_token', token, { httpOnly: true, secure: false });
  const { password: _, ...userResponse } = user;
  res.status(200).json(userResponse);
});

router.get('/user', isAuthenticated, (req, res) => {
  const { password, ...userResponse } = req.user;
  res.status(200).json(userResponse);
});

router.post('/logout', (req, res) => {
  const token = req.cookies.access_token;
  if (token) {
    invalidateToken(token);
    res.clearCookie('access_token');
  } else {
    return res.status(401).json({ detail: 'User is not authenticated' });
  }
  res.status(200).send();
});

router.post('/refresh', isAuthenticated, (req, res) => {
  const token = generateTokenForUser(req.user.id);
  res.cookie('access_token', token, { httpOnly: true, secure: false });
  const { password, ...userResponse } = req.user;
  res.status(200).json(userResponse);
});

router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  const user = await findUserBy({ id });

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }
  const { password, ...userResponse } = user;
  res.status(200).json(userResponse);
});

router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    const updatedUser = await updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const { password, ...userResponse } = updatedUser;
    res.status(200).json(userResponse);
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});

router.put('/:user_id', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const updatedUser = await updateUser(req.params.user_id, updates);

    if (!updatedUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const { password, ...userResponse } = updatedUser;
    res.status(200).json(userResponse);
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});
// пока что не понятно как оно будет на самом деле
router.post('/me/avatar', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ detail: 'avatar_url is required' });
    }

    const updatedUser = await updateAvatar(userId, avatar_url);

    if (!updatedUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const { password, ...userResponse } = updatedUser;
    res.status(200).json(userResponse);
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});

router.post('/me/password', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { new_password } = req.body;
    await updateUser(userId, { password: new_password });
    res.status(200).json({});
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});

router.post(
  '/psychologists',
  isAuthenticated,
  requireAdmin,
  async (req, res) => {
    try {
      const newPsychologist = await createPsychologist(req.body);
      res.status(201).json(newPsychologist);
    } catch (e) {
      res.status(400).json({ detail: e.message });
    }
  },
);

router.delete(
  '/psychologists/:id',
  isAuthenticated,
  requireAdmin,
  async (req, res) => {
    try {
      await deletePsychologist(req.params.id);
      res.status(200).send();
    } catch (e) {
      res.status(404).json({ detail: e.message });
    }
  },
);

export default router;
