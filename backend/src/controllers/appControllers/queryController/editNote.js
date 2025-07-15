const editNote = async (Model, req, res) => {
  try {
    const { id, noteId } = req.params;
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

    const note = query.notes.id(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    note.content = content.trim();
    note.updated = new Date();

    await query.save();

    return res.status(200).json({
      success: true,
      result: note,
      message: 'Note updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = editNote;
