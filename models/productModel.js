import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";

const product_schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "brand",
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categorie",
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  discount: {
    type: Number,
    required: true,
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"],
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "offer",
    default: null,
  },
  quantity_sold: {
    type: Number,
    default: 0,
  },
  variants: [
    {
      color: {
        type: String,
        required: true,
        trim: true,
      },
      ram: {
        type: String,
        required: true,
      },
      storage: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      stock: {
        type: Number,
        required: true,
        default: 0,
      },
      images: [
        {
          type: String,
          required: true,
        },
      ],
      sku: {
        type: String,
        required: true,
        unique: true,
      },
    },
  ],
  specifications: {
    processor: {
      type: String,
      required: true,
    },
    battery: {
      type: String,
      required: true,
    },
    camera: {
      front: {
        type: String,
        required: true,
      },
      rear: {
        type: String,
        required: true,
      },
    },
    display: {
      size: {
        type: String,
        required: true,
      },
      resolution: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
    },
    os: {
      type: String,
      required: true,
      enum: ["Android", "iOS", "Windows", "Others"],
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  releaseDate: {
    type: Date,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

product_schema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

product_schema.plugin(paginate);

// Add indexes for improved query performance
product_schema.index({ name: 1 });
product_schema.index({ category: 1 });
product_schema.index({ brand: 1 });
product_schema.index({ price: 1 });

const Product = mongoose.model("Product", product_schema);

export default Product;
