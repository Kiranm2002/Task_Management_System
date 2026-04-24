const analyticsService = require("./analytics.service");

exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await analyticsService.getAdminAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await analyticsService.getUserAnalytics(userId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeepAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getDeepAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching deep analytics",
      error: error.message 
    });
  }
};

exports.getTeamPerformance = async (req, res) => {
    try {
        const performanceData = await analyticsService.calculateTeamPerformance();
        
        res.status(200).json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};