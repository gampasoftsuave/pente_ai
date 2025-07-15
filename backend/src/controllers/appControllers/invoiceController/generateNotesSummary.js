const mongoose = require('mongoose');
const geminiService = require('@/services/geminiService');

const Model = mongoose.model('Invoice');

const generateNotesSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the invoice
    const invoice = await Model.findById(id);
    console.log('invoice.items: ', invoice);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Extract notes from all items
    const notes = invoice.items
      .map(item => {
        console.log(`Item "${item.itemName}" notes: "${item.notes}"`);
        return item.notes;
      })
      .filter(note => note && note.trim() !== '');
    
    console.log('Total notes found: ', notes.length);
    console.log('Notes array: ', notes);

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No notes found to summarize',
        result: {
          summary: 'No item notes available for this invoice.',
          noteCount: 0
        }
      });
    }

    // Generate summary using Gemini
    const summary = await geminiService.generateSummary(notes);
    
    console.log('invoice: ', invoice);
    console.log('notes extracted: ', notes);
    console.log('generated summary: ', summary);
    
    // Update ONLY the notesSummary field without affecting items
    const updateResult = await Model.findByIdAndUpdate(
      id,
      { 
        notesSummary: summary,
        updated: new Date()
      },
      { 
        new: true,
        runValidators: false // Don't run validators to avoid potential issues with existing data
      }
    );
    
    console.log('Updated invoice notesSummary successfully',updateResult);

    return res.status(200).json({
      success: true,
      message: 'Notes summary generated successfully',
      result: {
        summary,
        noteCount: notes.length
      }
    });

  } catch (error) {
    console.error('Error generating notes summary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate notes summary',
    });
  }
};

module.exports = generateNotesSummary;
