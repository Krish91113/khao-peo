// ─── Table Session Repository ────────────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose from "mongoose";
import { TableSessionModel, type ITableSession } from "../models/table-session.model.js";

export const tableSessionRepository = {
  async findByTable(
    tableId: string,
    restaurantId: string,
    session?: mongoose.ClientSession,
  ): Promise<ITableSession | null> {
    const query = TableSessionModel.findOne({
      tableId,
      restaurantId,
    });
    if (session) {
      query.session(session);
    }
    return query.exec();
  },

  async upsertSession(
    tableId: string,
    restaurantId: string,
    update: Partial<ITableSession>,
    session?: mongoose.ClientSession,
  ): Promise<ITableSession> {
    const query = TableSessionModel.findOneAndUpdate(
      {
        tableId,
        restaurantId,
      },
      {
        $set: {
          ...update,
          tableId: new mongoose.Types.ObjectId(tableId),
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
        },
      },
      { upsert: true, new: true },
    );
    if (session) {
      query.session(session);
    }
    return (await query.exec())!;
  },

  async findAllByRestaurant(restaurantId: string): Promise<ITableSession[]> {
    return TableSessionModel.find({
      restaurantId,
    }).exec();
  },

  async clearSession(
    tableId: string,
    restaurantId: string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    const query = TableSessionModel.findOneAndUpdate(
      {
        tableId,
        restaurantId,
      },
      {
        $set: {
          currentWaiterId: null,
          activeAssignmentId: null,
          status: "VACANT",
          sessionEndAt: new Date(),
        },
      },
    );
    if (session) {
      query.session(session);
    }
    await query.exec();
  },
};
