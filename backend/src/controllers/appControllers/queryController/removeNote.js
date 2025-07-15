const removeNote = async (Model, req, res) => {
  try {
    const { id, noteId } = req.params;

    const query = await Model.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    const noteIndex = query.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check if the user is authorized to delete the note
    const note = query.notes[noteIndex];

    query.notes.splice(noteIndex, 1);
    query.updated = new Date();
    
    await query.save();

    return res.status(200).json({
      success: true,
      message: 'Note removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = removeNote;
