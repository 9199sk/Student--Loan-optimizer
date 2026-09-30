import mongoose from 'mongoose';

const loanInputSchema = new mongoose.Schema(
  {
    principal: { type: Number, required: true },       // INR
    annualRate: { type: Number, required: true },       // percentage e.g. 10
    tenureMonths: { type: Number, required: true },    // total tenure in months
    moratoriumMonths: { type: Number, default: 0 },    // months before repayment starts
    startDate: { type: Date, required: true },
  },
  { _id: false }
);

const prepaymentSchema = new mongoose.Schema(
  {
    extraMonthly: { type: Number, default: 0 },
    lumpSum: { type: Number, default: 0 },
    lumpSumMonth: { type: Number, default: 0 }, // month number from start (1-indexed)
  },
  { _id: false }
);

const scenarioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    loanInput: { type: loanInputSchema, required: true },
    prepayment: { type: prepaymentSchema, default: () => ({}) },
    // Cached results for quick display (recalculated on frontend if needed)
    summary: {
      emi: Number,
      totalInterest: Number,
      interestSaved: Number,
      monthsSaved: Number,
      debtFreeDate: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Scenario', scenarioSchema);
