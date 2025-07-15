const mongoose = require('mongoose');
const geminiService = require('@/services/geminiService');

const Model = mongoose.model('Invoice');

const generateNotesFromRequest = async (req, res) => {
  try {
    const { notes, invoiceId } = req.body;
    
    console.log('Received notes from frontend:', notes);
    console.log('Invoice ID (optional):', invoiceId);
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No notes provided to summarize',
      });
    }

    // Filter out empty or whitespace-only notes
    const validNotes = notes
      .map(note => note ? note.trim() : '')
      .filter(note => note.length > 0);
    
    console.log('Valid notes count:', validNotes.length);
    console.log('Valid notes:', validNotes);

    if (validNotes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No valid notes found to summarize',
        result: {
          summary: 'No valid item notes provided.',
          noteCount: 0
        }
      });
    }

    // Generate summary using Gemini
    const summary = await geminiService.generateSummary(validNotes);
    
    console.log('Generated summary:', summary);
    
    // If an invoice ID is provided, optionally update the invoice with the new summary
    if (invoiceId) {
      try {
        await Model.findByIdAndUpdate(
          invoiceId,
          { notesSummary: summary },
          { new: true }
        );
        console.log(`Updated invoice ${invoiceId} with new summary`);
      } catch (updateError) {
        console.warn('Failed to update invoice with summary:', updateError.message);
        // Don't fail the request if update fails, just log it
      }
    }

    return res.status(200).json({
      success: true,
      message: `Summary generated successfully for ${validNotes.length} notes`,
      result: {
        summary,
        noteCount: validNotes.length
      }
    });

  } catch (error) {
    console.error('Error generating notes summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating summary',
      error: error.message
    });
  }
};

module.exports = generateNotesFromRequest;
