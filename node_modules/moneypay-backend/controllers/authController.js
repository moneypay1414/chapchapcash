import User from '../models/User.js';
import { hashPassword, comparePassword, generateToken, generateVerificationCode, reverseGeocode } from '../utils/helpers.js';
import { sendVerificationCode } from '../utils/sms.js';
import Verification from '../models/Verification.js';
import { Op } from 'sequelize';

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, agentId } = req.body;

    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // If role is agent but no agentId provided, generate one
    let finalAgentId = agentId;
    if (role === 'agent') {
      if (!agentId) {
        // Auto-generate unique 6-digit agent ID
        let isUnique = false;
        while (!isUnique) {
          finalAgentId = Math.floor(Math.random() * 900000) + 100000;
          const existing = await User.findOne({ where: { agentId: finalAgentId.toString() } });
          if (!existing) {
            isUnique = true;
          }
        }
      } else {
        // Verify provided agentId is unique
        const existingAgent = await User.findOne({ where: { agentId } });
        if (existingAgent) {
          return res.status(400).json({ message: 'Agent ID already exists' });
        }
      }
    }

    // If role is admin, generate a unique 6-digit admin ID
    let finalAdminId = null;
    if (role === 'admin') {
      let isUnique = false;
      while (!isUnique) {
        finalAdminId = Math.floor(Math.random() * 900000) + 100000;
        const existing = await User.findOne({ where: { adminId: finalAdminId.toString() } });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const hashedPassword = await hashPassword(password);
    const verificationCode = generateVerificationCode();

    console.log('Registering user:', { name, email, phone, role, finalAgentId, finalAdminId });

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
      agentId: finalAgentId,
      adminId: finalAdminId,
      verificationCode,
      verificationExpiry: new Date(Date.now() + 10 * 60000)
    });

    // Send SMS verification code
    try {
      await sendVerificationCode(phone, verificationCode);
    } catch (error) {
      console.error('SMS failed but user registered:', error);
    }

    res.status(201).json({
      message: 'User registered. Please verify your phone number.',
      userId: user.id,
      phone: user.phone,
      agentId: finalAgentId || null,
      adminId: finalAdminId || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verificationCode !== code || user.verificationExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, latitude, longitude } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact customer care to restore access.' });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update location if provided
    if (latitude && longitude) {
      const locationData = await reverseGeocode(latitude, longitude);
      user.currentLocation = {
        latitude,
        longitude,
        city: locationData.city,
        country: locationData.country,
        timestamp: new Date()
      };
      await user.save();
    } else if (user.adminLocationConsent) {
      // Admin has opted users into server-side/IP-based location capture.
      try {
        const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
        let ip = '';
        if (forwarded) ip = forwarded.split(',')[0].trim();
        if (!ip) ip = req.connection?.remoteAddress || req.socket?.remoteAddress || '';

        // ipapi accepts empty path to use caller IP; use client IP if available
        const ipPath = ip && !ip.startsWith('127.') && ip !== '::1' ? `${ip}/json/` : 'json/';
        const ipRes = await fetch(`https://ipapi.co/${ipPath}`);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const lat = ipData.latitude || ipData.lat || null;
          const lon = ipData.longitude || ipData.lon || null;
          if (lat && lon) {
            const locationData = await reverseGeocode(lat, lon);
            user.currentLocation = {
              latitude: lat,
              longitude: lon,
              city: locationData.city,
              country: locationData.country,
              timestamp: new Date()
            };
            await user.save();
          }
        }
      } catch (e) {
        console.warn('IP geolocation failed on login:', e.message || e);
      }
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: parseFloat(user.balance) || 0,
        isVerified: user.isVerified,
        agentId: user.agentId || null,
        adminId: user.adminId || null,
        autoAdminCashout: user.autoAdminCashout || false,
        adminLocationConsent: user.adminLocationConsent || false,
        theme: user.theme || 'light',
        currentLocation: user.currentLocation || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    // Ensure balance is returned as a number
    const userData = user.toJSON();
    userData.balance = parseFloat(userData.balance) || 0;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, profileImage, idNumber, autoAdminCashout, theme } = req.body;

    // Build update object only with provided fields
    const update = { updatedAt: new Date() };
    if (typeof name !== 'undefined') update.name = name;
    if (typeof profileImage !== 'undefined') update.profileImage = profileImage;
    if (typeof idNumber !== 'undefined') update.idNumber = idNumber;
    if (typeof autoAdminCashout !== 'undefined') update.autoAdminCashout = !!autoAdminCashout;
    if (typeof theme !== 'undefined') update.theme = theme;

    const user = await User.update(update, {
      where: { id: req.userId },
      returning: true
    });

    // Get the updated user
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkUserBalance = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({
      where: { phone },
      attributes: ['id', 'name', 'phone', 'balance', 'isVerified', 'isSuspended']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'User account is suspended' });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      balance: parseFloat(user.balance) || 0,
      isVerified: user.isVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
