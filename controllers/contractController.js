const {
  getAllContractsService,
  createContractService,
  updateContractService,
  deleteContractService,
  getDashboardStatsService,
} = require("../services/contractService");
const User = require("../modules/userModule");
const { createContractCreatedNotification } = require("../services/notificationService");

// GET ALL CONTRACTS (admin: created by me; user: assigned to me)
  const getAllContracts = async (req, res) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "You must be logged in to view contracts.",
        });
      }

      const contracts = await getAllContractsService(userId, role);

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
      phone_number,
      assigned_user_email,
      assigned_to: assignedToFromBody,
      description,
    } = req.body;

    // Creator = logged-in user (from JWT)
    const created_by = req.user?.id;
    if (!created_by) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to create a contract.",
      });
    }

    // Resolve assigned_to: use body id if provided, else look up by assigned_user_email
    let assigned_to = assignedToFromBody || null;
    if (!assigned_to && assigned_user_email) {
      const assignedUser = await User.findOne({
        email: assigned_user_email.toLowerCase().trim(),
      }).select("_id");
      if (assignedUser) assigned_to = assignedUser._id;
    }

    const contract = await createContractService({
      contract_name,
      contract_type,
      start_date,
      client_name,
      status,
      amount,
      description,
      assigned_user_email: assigned_user_email || "",
      phone_number: phone_number || "",
      created_by,
      end_date,
      assigned_to,
    });

    if (assigned_to) {
      try {
        await createContractCreatedNotification(contract);
      } catch (notifErr) {
        console.error("Notification create failed:", notifErr);
      }
    }

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

const updateContract = async (req, res) => {
  try {
    const contractId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const {
      contract_name,
      contract_type,
      start_date,
      end_date,
      amount,
      client_name,
      phone_number,
      assigned_user_email,
      assigned_to: assignedToFromBody,
      description,
    } = req.body;

    let assigned_to = assignedToFromBody || null;
    if (!assigned_to && assigned_user_email) {
      const assignedUser = await User.findOne({
        email: assigned_user_email.toLowerCase().trim(),
      }).select("_id");
      if (assignedUser) assigned_to = assignedUser._id;
    }

    const contract = await updateContractService(contractId, userId, {
      contract_name,
      contract_type,
      start_date,
      end_date,
      amount,
      client_name,
      phone_number,
      assigned_user_email: assigned_user_email || "",
      description,
      ...(assigned_to != null && { assigned_to }),
    });

    res.status(200).json({
      success: true,
      message: "Contract updated successfully",
      data: contract,
    });
  } catch (error) {
    console.error(error);
    const status = error.message?.includes("not found") || error.message?.includes("not allowed")
      ? 404
      : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE CONTRACT (only contracts created by logged-in admin)
const deleteContract = async (req, res) => {
  
  try {
    const contractId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    await deleteContractService(contractId, userId);

    res.status(200).json({
      success: true,
      message: "Contract deleted successfully",
    });
  } catch (error) {
    const status = error.message?.includes("not found") || error.message?.includes("not allowed")
      ? 404
      : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// GET DASHBOARD STATS (admin: by created_by, user: by assiged_to)
const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const data = await getDashboardStatsService(userId, role);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllContracts,
  createContract,
  updateContract,
  deleteContract,
  getDashboard,
};
