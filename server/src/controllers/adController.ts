import { Request, Response, NextFunction } from 'express';
import { Ad } from '../models/Ad';

// @desc    Get active ad for a page
// @route   GET /api/ads/active
// @access  Public
export const getActiveAd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const module = req.query.module as string || 'all';
    const role = req.query.role as string || 'public';
    
    // Find an active ad that has at least one target matching this role & module, or 'all'
    const ads = await Ad.find({
      isActive: true,
      targets: {
        $elemMatch: {
          $or: [{ role: role }, { role: 'all' }],
          $and: [{ $or: [{ module: module }, { module: 'all' }] }]
        }
      }
    }).sort({ createdAt: -1 });

    // Prefer exact module match over 'all', if both exist
    const exactMatch = ads.find(ad => ad.targets.some(t => t.module === module && t.role === role));
    const roleMatch = ads.find(ad => ad.targets.some(t => t.role === role));
    const adToSend = exactMatch || roleMatch || ads[0];

    if (adToSend) {
      res.json(adToSend);
    } else {
      res.status(404).json({ message: 'No active ad found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ads (admin)
// @route   GET /api/ads
// @access  Private/Admin
export const getAds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new ad
// @route   POST /api/ads
// @access  Private/Admin
export const createAd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, imageUrl, targets, durationMs, isActive } = req.body;

    const ad = await Ad.create({
      title,
      imageUrl,
      targets: targets || [{ role: 'all', module: 'all' }],
      durationMs,
      isActive
    });

    res.status(201).json(ad);
  } catch (error) {
    next(error);
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private/Admin
export const updateAd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (ad) {
      ad.title = req.body.title ?? ad.title;
      ad.imageUrl = req.body.imageUrl ?? ad.imageUrl;
      ad.targets = req.body.targets ?? ad.targets;
      ad.durationMs = req.body.durationMs ?? ad.durationMs;
      ad.isActive = req.body.isActive ?? ad.isActive;

      const updatedAd = await ad.save();
      res.json(updatedAd);
    } else {
      res.status(404);
      throw new Error('Ad not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private/Admin
export const deleteAd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (ad) {
      res.json({ message: 'Ad removed' });
    } else {
      res.status(404);
      throw new Error('Ad not found');
    }
  } catch (error) {
    next(error);
  }
};
