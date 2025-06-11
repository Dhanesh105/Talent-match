import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Generate JWT token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'defaultsecret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create user with role
    const user: IUser = await User.create({
      name,
      email,
      password,
      role: role || 'candidate', // Default to candidate if not specified
    });

    if (user) {
      // Use user._id with proper type casting
      const userId = user._id instanceof mongoose.Types.ObjectId 
        ? user._id.toString() 
        : typeof user._id === 'string' ? user._id : String(user._id);
      
      // Return a user object that matches the frontend User interface
      res.status(201).json({
        user: {
          _id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: generateToken(userId),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Check for user email
    const user: IUser | null = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("Password does not match for user:", email);
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Use user._id with proper type casting
    const userId = user._id instanceof mongoose.Types.ObjectId 
      ? user._id.toString() 
      : typeof user._id === 'string' ? user._id : String(user._id);
    
    // Format the response to match what frontend expects
    const responseData = {
      user: {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: generateToken(userId),
    };
    
    console.log("Login successful, sending response:", JSON.stringify(responseData));
    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user.id;
    console.log("Getting profile for user ID:", userId);
    
    const user: IUser | null = await User.findById(userId).select('-password');

    if (!user) {
      console.log("User not found with ID:", userId);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Use user._id with proper type casting
    const id = user._id instanceof mongoose.Types.ObjectId 
      ? user._id.toString() 
      : typeof user._id === 'string' ? user._id : String(user._id);
    
    // Format response to match what frontend expects - same format as login response
    const userData = {
      _id: id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    console.log("User profile found, sending response:", { user: userData });
    res.json({ user: userData, token: generateToken(id) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
