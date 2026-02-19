const Contract = require("../modules/contractModule");
const mongoose = require("mongoose");

// GET ALL CONTRACTS SERVICE (admin: created_by; user: assigned_to)
const getAllContractsService = async (userId, role) => {
  const userIdObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;
  const isUserRole = role === "user";
  const query = userIdObjectId
    ? isUserRole
      ? { $or: [{ assigned_to: userIdObjectId }, { assiged_to: userIdObjectId }] }
      : { created_by: userIdObjectId }
    : {};

  const contracts = await Contract.find(query)
    .populate("created_by", "username email")
    .populate("assigned_to", "username email")
    .sort({ createdAt: -1 }); // latest first
    const today = new Date();

  for (let contract of contracts) {
    if (today >= contract.end_date) {
      contract.status = "Expired";
    } else if (today >= contract.start_date) {
      contract.status = "Active";
    }
     else {
      contract.status = "Pending";
    }

    await contract.save();
  }

  return contracts;
};

// GET SINGLE CONTRACT
const getContractDetailsService = async (contractId) => {
  const contract = await Contract.findById(contractId)
    .populate("created_by", "username email");

  if (!contract) {
    throw new Error("Contract not found");
  }

  return contract;
};

const createContractService = async (contractData) => {
  const contract = new Contract(contractData);
  return await contract.save();
};

// UPDATE CONTRACT (only if created by the same user)
const updateContractService = async (contractId, userId, updateData) => {
  if (!contractId) throw new Error("Contract ID is required");
  if (!userId) throw new Error("User must be logged in to update");

  const contract = await Contract.findOne({
    _id: new mongoose.Types.ObjectId(contractId),
    created_by: new mongoose.Types.ObjectId(userId),
  });

  if (!contract) {
    throw new Error("Contract not found or you are not allowed to update it");
  }

  const updatedContract = await Contract.findByIdAndUpdate(
    contractId,
    updateData,
    { new: true, runValidators: true }
  ).populate("created_by", "username email");

  return updatedContract;
};

// DELETE CONTRACT (only if created by the same user)
const deleteContractService = async (contractId, userId) => {
  if (!contractId) throw new Error("Contract ID is required");
  if (!userId) throw new Error("User must be logged in to delete");

  const contract = await Contract.findOne({
    _id: new mongoose.Types.ObjectId(contractId),
    created_by: new mongoose.Types.ObjectId(userId),
  });

  if (!contract) {
    throw new Error("Contract not found or you are not allowed to delete it");
  }

  await Contract.findByIdAndDelete(contractId);
  return { deleted: true, id: contractId };
};

// DASHBOARD: stats + recent contracts
// Admin: contracts created by userId. User: contracts assigned to userId (assiged_to)
const getDashboardStatsService = async (userId, role) => {
  const now = new Date();
  const expiringSoonEnd = new Date(now);
  expiringSoonEnd.setDate(expiringSoonEnd.getDate() + 10);

  const userIdObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;
  const isUserRole = role === "user";
  // User sees contracts where assigned_to = their id (support both field names for existing data)
  const baseMatch = userIdObjectId
    ? isUserRole
      ? {
          $or: [
            { assigned_to: userIdObjectId },
            { assiged_to: userIdObjectId },
          ],
        }
      : { created_by: userIdObjectId }
    : {};
  const activeMatch = { ...baseMatch, status: "Active" };

  const [
    total,
    activeCount,
    expiredCount,
    pendingCount,
    activeValueResult,
    expiringSoonCount,
    typeGroups,
    statusGroups,
    recentContracts,
  ] = await Promise.all([
    Contract.countDocuments(baseMatch),
    Contract.countDocuments(activeMatch),
    Contract.countDocuments({ ...baseMatch, status: "Expired" }),
    Contract.countDocuments({ ...baseMatch, status: "Pending" }),
    Contract.aggregate([
      { $match: activeMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Contract.countDocuments({
      ...activeMatch,
      end_date: { $gte: now, $lte: expiringSoonEnd },
    }),
    Contract.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$contract_type", count: { $sum: 1 } } },
    ]),
    Contract.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Contract.find(baseMatch)
      .populate("created_by", "username email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const activeValue = activeValueResult[0]?.total ?? 0;
  const totalForPct = total || 1;

  // Filter out null/undefined _id values and map to frontend format
  const contractTypes = typeGroups
    .filter((g) => g._id != null) // Filter out null/undefined types
    .map((g) => ({
      label: g._id,
      value: String(g.count),
      percentage: Math.round((g.count / totalForPct) * 100),
    }));

  // Filter out null/undefined _id values and map to frontend format
  const statusDistribution = statusGroups
    .filter((g) => g._id != null) // Filter out null/undefined statuses
    .map((g) => ({
      label: g._id,
      value: `${g.count} (${Math.round((g.count / totalForPct) * 100)}%)`,
      count: g.count,
    }));

  return {
    stats: {
      total,
      activeCount,
      expiredCount,
      pendingCount,
      activeValue,
      expiringSoonCount,
    },
    contractTypes,
    statusDistribution,
    recentContracts,
  };
};

module.exports = {
  getAllContractsService,
  getContractDetailsService,
  createContractService,
  updateContractService,
  deleteContractService,
  getDashboardStatsService,
};
