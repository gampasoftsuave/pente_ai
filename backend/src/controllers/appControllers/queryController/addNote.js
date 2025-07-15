const addNote = async (Model, req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const query = await Model.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    const newNote = {
      content: content.trim(),
    };

    query.notes.push(newNote);
    query.updated = new Date();
    
    const updatedQuery = await query.save();


    return res.status(200).json({
      success: true,
      result: updatedQuery,
      message: 'Note added successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = addNote;
