const summary = async (Model, req, res) => {
  try {
    const aggregationPipeline = [
      {
        $match: {
          removed: false,
        },
      },
      {
        $group: {
          _id: null,
          totalQueries: { $sum: 1 },
          openQueries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Open'] }, 1, 0],
            },
          },
          inProgressQueries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'InProgress'] }, 1, 0],
            },
          },
          closedQueries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0],
            },
          },
          highPriorityQueries: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'High'] }, 1, 0],
            },
          },
          criticalPriorityQueries: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQueries: 1,
          openQueries: 1,
          inProgressQueries: 1,
          closedQueries: 1,
          highPriorityQueries: 1,
          criticalPriorityQueries: 1,
        },
      },
    ];

    const result = await Model.aggregate(aggregationPipeline);
    
    const summaryData = result[0] || {
      totalQueries: 0,
      openQueries: 0,
      inProgressQueries: 0,
      closedQueries: 0,
      highPriorityQueries: 0,
      criticalPriorityQueries: 0,
    };

    return res.status(200).json({
      success: true,
      result: summaryData,
      message: 'Successfully retrieved query summary',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = summary;
