const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ledgerBookSchema = new Schema({
    Order_id: {
        type: Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    transactions:{
       type:String,
        required:true,
    },
    balance: {
        type: Number,
        default: 0
    },
    debit: {
        type: Number,
        default: 0
    },
    credit: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
     TotalBalance: {
        type: Number,
        default: 0
    },
});

const Ledgerbook = mongoose.model('LedgerBook', ledgerBookSchema);

module.exports = Ledgerbook;