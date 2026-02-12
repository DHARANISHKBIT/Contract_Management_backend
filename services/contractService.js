const Contract = require("../modules/contractModule");

// GET ALL CONTRACTS SERVICE
const getAllContractsService = async () => {
  const contracts = await Contract.find()
    .populate("created_by", "username email")
    .sort({ createdAt: -1 }); // latest first

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

// DASHBOARD: stats + recent contracts (for admin dashboard)
const getDashboardStatsService = async () => {
  const now = new Date();
  const expiringSoonEnd = new Date(now);
  expiringSoonEnd.setDate(expiringSoonEnd.getDate() + 30);

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
    Contract.countDocuments(),
    Contract.countDocuments({ status: "Active" }),
    Contract.countDocuments({ status: "Expired" }),
    Contract.countDocuments({ status: "Pending" }),
    Contract.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Contract.countDocuments({
      status: "Active",
      end_date: { $gte: now, $lte: expiringSoonEnd },
    }),
    Contract.aggregate([
      { $group: { _id: "$contract_type", count: { $sum: 1 } } },
    ]),
    Contract.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Contract.find()
      .populate("created_by", "username email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const activeValue = activeValueResult[0]?.total ?? 0;
  const totalForPct = total || 1;

  const contractTypes = typeGroups.map((g) => ({
    label: g._id,
    value: String(g.count),
    percentage: Math.round((g.count / totalForPct) * 100),
  }));

  const statusDistribution = statusGroups.map((g) => ({
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
  getDashboardStatsService,
};
