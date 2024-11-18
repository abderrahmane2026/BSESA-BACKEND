import { Router } from "express";
import {
  AddCategory,
  DeleteCategory,
  GetCategorys,
} from "../controllers/CategoryController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const CategoryRouter = Router();

CategoryRouter.post(
  "/category",
  authenticateToken,
  authorizeRoles(["admin"]),
  AddCategory
);

CategoryRouter.delete(
  "/category/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  DeleteCategory
);

CategoryRouter.get("/categorys", GetCategorys);

export default CategoryRouter;
