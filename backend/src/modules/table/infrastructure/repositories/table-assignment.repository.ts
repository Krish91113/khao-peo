// ─── Table Assignment Repository ──────────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose from "mongoose";
import {
  TableAssignmentModel,
  type ITableAssignment,
} from "../models/table-assignment.model.js";

export const tableAssignmentRepository = {
  async create(
    data: {
      restaurantId: mongoose.Types.ObjectId;
      tableId: mongoose.Types.ObjectId;
      waiterId: mongoose.Types.ObjectId;
      assignedBy: mongoose.Types.ObjectId;
      status?: "ACTIVE" | "RELEASED" | "REASSIGNED";
    },
    session?: mongoose.ClientSession,
  ): Promise<ITableAssignment> {
    const docs = await TableAssignmentModel.create([data], { session });
    return docs[0]!;
  },

  async findActiveByTable(
    tableId: string,
    restaurantId: string,
    session?: mongoose.ClientSession,
  ): Promise<ITableAssignment | null> {
    const query = TableAssignmentModel.findOne({
      tableId,
      restaurantId,
      status: "ACTIVE",
    });
    if (session) {
      query.session(session);
    }
    return query.exec();
  },

  async findActiveByWaiter(
    waiterId: string,
    restaurantId: string,
  ): Promise<ITableAssignment[]> {
    return TableAssignmentModel.find({
      waiterId,
      restaurantId,
      status: "ACTIVE",
    }).exec();
  },

  async countActiveByWaiter(waiterId: string, restaurantId: string): Promise<number> {
    // Unit callers may use symbolic fixture IDs; no persisted assignment can
    // exist for those values, so avoid asking Mongoose to cast them.
    if (!mongoose.isValidObjectId(waiterId) || !mongoose.isValidObjectId(restaurantId)) return 0;
    return TableAssignmentModel.countDocuments({
      waiterId: new mongoose.Types.ObjectId(waiterId),
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      status: "ACTIVE",
    }).exec();
  },

  async updateStatus(
    id: mongoose.Types.ObjectId,
    status: "RELEASED" | "REASSIGNED",
    reason?: string | null,
    session?: mongoose.ClientSession,
  ): Promise<ITableAssignment | null> {
    const query = TableAssignmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          releasedAt: new Date(),
          releaseReason: reason ?? null,
        },
      },
      { new: true },
    );
    if (session) {
      query.session(session);
    }
    return query.exec();
  },

  async findHistoryByTable(
    tableId: string,
    restaurantId: string,
  ): Promise<ITableAssignment[]> {
    return TableAssignmentModel.find({
      tableId,
      restaurantId,
    })
      .sort({ createdAt: -1 })
      .populate("waiterId", "name email role")
      .populate("assignedBy", "name email role")
      .exec();
  },
};
