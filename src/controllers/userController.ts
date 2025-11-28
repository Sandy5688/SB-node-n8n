import { Request, Response } from 'express';
import { getDb } from '../db/mongo';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function getUserController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  
  if (!id) {
    res.status(400).json({ error: { message: 'user id is required' } });
    return;
  }
  
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ user_id: id });
    
    if (!user) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }
    
    // Remove sensitive fields
    delete user._id;
    delete user.password_hash;
    
    res.json({ user });
  } catch (err: any) {
    logger.error(`Get user failed: ${err?.message}`);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

export async function createUserController(req: Request, res: Response): Promise<void> {
  const { email, phone, name, metadata } = req.body || {};
  
  if (!email && !phone) {
    res.status(400).json({ error: { message: 'email or phone is required' } });
    return;
  }
  
  try {
    const db = await getDb();
    
    // Check if user already exists
    const existing = await db.collection('users').findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ]
    });
    
    if (existing) {
      res.status(409).json({ error: { message: 'User already exists' } });
      return;
    }
    
    const user_id = uuidv4();
    const now = new Date();
    
    const newUser = {
      user_id,
      email,
      phone,
      name,
      metadata: metadata || {},
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    
    await db.collection('users').insertOne(newUser);
    
    // Remove internal fields
    delete (newUser as any)._id;
    
    res.status(201).json({ user: newUser });
  } catch (err: any) {
    logger.error(`Create user failed: ${err?.message}`);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

export async function updateUserController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { email, phone, name, metadata, status } = req.body || {};
  
  if (!id) {
    res.status(400).json({ error: { message: 'user id is required' } });
    return;
  }
  
  try {
    const db = await getDb();
    
    const updateFields: any = { updatedAt: new Date() };
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (name !== undefined) updateFields.name = name;
    if (metadata !== undefined) updateFields.metadata = metadata;
    if (status !== undefined) updateFields.status = status;
    
    const result = await db.collection('users').updateOne(
      { user_id: id },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }
    
    const updatedUser = await db.collection('users').findOne({ user_id: id });
    delete (updatedUser as any)._id;
    delete (updatedUser as any).password_hash;
    
    res.json({ user: updatedUser });
  } catch (err: any) {
    logger.error(`Update user failed: ${err?.message}`);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

