const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');

const update = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const previousInvoice = await Model.findOne({
    _id: req.params.id,
    removed: false,
  });

  const { credit } = previousInvoice;

  // Use validated data instead of raw req.body
  const { items = [], taxRate = 0, discount = 0 } = value;
  
  console.log('Update request - items received:', JSON.stringify(items, null, 2));

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Items cannot be empty',
    });
  }

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
    // Log to check if notes are preserved
    if (item.notes) {
      console.log(`Item "${item.itemName}" has notes: "${item.notes}"`);
    } else {
      console.log(`Item "${item.itemName}" has NO notes`);
    }
  });
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;
  body['pdf'] = 'invoice-' + req.params.id + '.pdf';
  
  console.log('About to save to database - final items:', JSON.stringify(body.items, null, 2));
  
  if (body.hasOwnProperty('currency')) {
    delete body.currency;
  }
  // Find document by id and updates with the required fields

  let paymentStatus =
    calculate.sub(total, discount) === credit ? 'paid' : credit > 0 ? 'partially' : 'unpaid';
  body['paymentStatus'] = paymentStatus;

  const result = await Model.findOneAndUpdate({ _id: req.params.id, removed: false }, body, {
    new: true, // return the new result instead of the old one
  }).exec();

  // Returning successfull response

  return res.status(200).json({
    success: true,
    result,
    message: 'we update this document ',
  });
};

module.exports = update;
