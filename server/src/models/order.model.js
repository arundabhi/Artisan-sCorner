import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  vendorPayout: {
    type: Number,
    required: true,
  },
  deliveryStatus: {
    type: String,
    enum: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PROCESSING',
  },
});

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    subtotal: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    vendorPayout: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PROCESSING',
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('validate', function (next) {
  if (this.paymentStatus) {
    this.paymentStatus = this.paymentStatus.toUpperCase();
  }
  if (this.orderStatus) {
    this.orderStatus = this.orderStatus.toUpperCase();
  }
  if (this.items && Array.isArray(this.items)) {
    this.items.forEach(item => {
      if (item.deliveryStatus) {
        item.deliveryStatus = item.deliveryStatus.toUpperCase();
      }
    });
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
