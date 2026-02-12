const {
  getAllContractsService,
  createContractService,
  getDashboardStatsService,
} = require("../services/contractService");

// GET ALL CONTRACTS CONTROLLER
const getAllContracts = async (req, res) => {
  try {
    const contracts = await getAllContractsService();

    res.status(200).json({
      success: true,
      count: contracts.length,
      contracts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createContract = async (req, res) => {
  try {
    const {
      contract_name,
      contract_type,
      start_date,
      end_date,
      amount,
      client_name,
      status,
      description,
    } = req.body;

    // created_by comes from authenticated user (JWT)
    const created_by = req.user.id;

    const contract = await createContractService({
      contract_name,
      contract_type,
      start_date,
      client_name,
      status,
      amount,
      description,
      created_by,
      end_date,
    });

    res.status(201).json({
      success: true,
      message: "Contract created successfully",
      data: contract,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET DASHBOARD STATS (for admin dashboard)
const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardStatsService();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllContracts,
  createContract,
  getDashboard,
};
