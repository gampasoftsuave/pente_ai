const mongoose = require('mongoose');

const create = async (Model, req, res) => {
  try {
    const { customerName } = req.body;
    
    // Find or create a client based on customerName
    const Client = mongoose.model('Client');
    let customer = await Client.findOne({ name: customerName });
    
    // If customer doesn't exist, create a new one
    if (!customer) {
      customer = await Client.create({
        name: customerName,
        createdBy: req.admin._id,
        enabled: true,
        removed: false
      });
    }
    
    // Create the query with the customer ID
    const queryData = {
      ...req.body,
      customerId: customer._id,
      createdBy: req.admin._id
    };
    
    const result = await Model.create(queryData);
    const populatedResult = await Model.findById(result._id)
      .populate('customerId')
      .populate('createdBy')
      .populate('assignedTo');

    return res.status(200).json({
      success: true,
      result: populatedResult,
      message: 'Query created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = create;
