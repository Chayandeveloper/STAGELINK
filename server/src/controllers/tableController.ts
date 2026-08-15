import { Request, Response } from 'express';
import { Table } from '../models/Table';
import { Reservation } from '../models/Reservation';

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = new Table({
      ...req.body,
    });
    const createdTable = await table.save();
    res.status(201).json(createdTable);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


export const getTablesByRestaurant = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    
    // Get all tables for the restaurant (except disabled ones)
    let tables = await Table.find({ 
      restaurant: req.params.restaurantId,
      status: { $ne: 'Disabled' } 
    });

    // If checking for a specific event, filter out tables that are already booked
    if (eventId) {
      const query: any = {
        event: eventId,
        reservationStatus: { $in: ['pending', 'confirmed'] }
      };
      const activeReservations = await Reservation.find(query);
      
      const reservedTableIds = activeReservations.map(r => r.table.toString());
      tables = tables.filter(t => !reservedTableIds.includes(t._id.toString()));
    }

    res.json(tables);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      Object.assign(table, req.body);
      const updatedTable = await table.save();
      res.json(updatedTable);
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      await table.deleteOne();
      res.json({ message: 'Table removed' });
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
