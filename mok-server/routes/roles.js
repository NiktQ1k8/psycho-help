import { Router } from 'express';
import { isAuthenticated } from '../lib/auth.js';
import { assignRole, removeRole } from '../services/user.js';

const router = Router();

function requireRoleAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ detail: 'Not authenticated' });
  const userRoleCodes = (req.user.roles || []).map((r) => r.code);
  if (!userRoleCodes.includes('admin')) {
    return res.status(403).json({ detail: 'Недостаточно прав' });
  }
  next();
}

router.post(
  '/:user_id/assign',
  isAuthenticated,
  requireRoleAdmin,
  async (req, res) => {
    try {
      const { role_code } = req.body;
      const updatedUser = await assignRole(req.params.user_id, role_code);
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (e) {
      res.status(400).json({ detail: e.message });
    }
  },
);

router.post(
  '/:user_id/remove',
  isAuthenticated,
  requireRoleAdmin,
  async (req, res) => {
    try {
      const { role_code } = req.body;
      const updatedUser = await removeRole(req.params.user_id, role_code);
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (e) {
      res.status(400).json({ detail: e.message });
    }
  },
);

export default router;
