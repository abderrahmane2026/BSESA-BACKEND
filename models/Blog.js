import { Schema, model } from "mongoose";

const blogPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 150,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    thumbnailUrl: {
      type: String, // URL to the thumbnail image for the post
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Blog = model("Blog", blogPostSchema);
export default Blog;
